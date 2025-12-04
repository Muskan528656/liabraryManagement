import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal, Alert } from "react-bootstrap";
import DynamicCRUD from "../common/DynaminCrud";
import { getLibraryCardConfig } from "./librarycardconfig";
import { useDataManager } from "../common/userdatamanager";
import Loader from "../common/Loader";
import JsBarcode from "jsbarcode";
import DataApi from "../../api/dataApi";
import { API_BASE_URL } from "../../constants/CONSTANT";
import { handleDownloadBarcode } from './LibraryCardDownload';
import { handlePrintBarcode } from './LibrarycardPrint';

const LibraryCard = (props) => {
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [barcodeError, setBarcodeError] = useState(null);
  const [baseConfig, setBaseConfig] = useState(null);
  const [finalConfig, setFinalConfig] = useState(null);


  const dataDependencies = baseConfig?.dataDependencies || [];
  const { data, loading, error } = useDataManager(dataDependencies, props);

  const [subscriptionsData, setSubscriptionsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);


  const fetchSubscriptions = useCallback(async () => {
    try {
      console.log("Fetching subscriptions data...");
      const subscriptionApi = new DataApi("subscriptions");
      const response = await subscriptionApi.fetchAll();
      
      let subscriptionData = [];
      
      if (response?.data) {
      
        if (response.data.success && response.data.data) {
          subscriptionData = response.data.data;
        } else if (Array.isArray(response.data)) {
          subscriptionData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          subscriptionData = response.data.data;
        } else if (response.data.rows && Array.isArray(response.data.rows)) {
          subscriptionData = response.data.rows;
        }
      }
      
      console.log(`Fetched ${subscriptionData.length} subscriptions`);
      setSubscriptionsData(subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setConfigError("Failed to load subscription data");
      return [];
    }
  }, []);


  const fetchUsers = useCallback(async () => {
    try {
      console.log("Fetching users data...");
      const userApi = new DataApi("user");
      const response = await userApi.fetchAll();
      
      let usersData = [];
      
      if (response?.data) {
        if (response.data.success && response.data.data) {
          usersData = response.data.data;
        } else if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        }
      }
      
      console.log(`Fetched ${usersData.length} users`);
      setUsersData(usersData);
      return usersData;
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }, []);


  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setLoadingConfig(true);
        setConfigError(null);
        
        console.log("Initializing library card configuration...");
        

        const [subscriptions, users] = await Promise.all([
          fetchSubscriptions(),
          fetchUsers()
        ]);
        

        const externalData = {
          subscriptions: subscriptions,
          users: users,
          ...props
        };
        
        console.log("External data for config:", {
          subscriptionsCount: subscriptions.length,
          usersCount: users.length
        });
        

        const config = await getLibraryCardConfig(externalData);
        setBaseConfig(config);
        
        console.log("Base config loaded successfully");
        
      } catch (error) {
        console.error("Error initializing config:", error);
        setConfigError("Failed to load configuration");
      } finally {
        setLoadingConfig(false);
      }
    };
    
    initializeConfig();
  }, [fetchSubscriptions, fetchUsers, props]);


  useEffect(() => {
    if (!baseConfig || loadingConfig) return;
    
    const buildFinalConfig = () => {
      try {
        console.log("Building final configuration...");
        

        const final = {
          ...baseConfig,
          

          formFields: baseConfig.formFields?.map(field => {

            if (field.name === "subscription_id") {
              return {
                ...field,
                options: subscriptionsData.length > 0 
                  ? subscriptionsData.map(sub => ({
                      value: sub.id,
                      label: `${sub.plan_name || sub.name || 'Subscription'} ${sub.allowed_books ? `(${sub.allowed_books} books)` : ''}`
                    }))
                  : [{ value: '', label: 'No subscriptions available' }],
                key: `subscription-select-${subscriptionsData.length}`
              };
            }
            

            if (field.name === "user_id") {
              return {
                ...field,
                options: usersData.length > 0
                  ? usersData.map(user => ({
                      value: user.id,
                      label: `${user.first_name || ''} ${user.last_name || ''} - ${user.email || user.username || ''}`
                    }))
                  : [{ value: '', label: 'No users available' }],
                key: `user-select-${usersData.length}`
              };
            }
            
            return field;
          }),
          

          columns: baseConfig.columns?.map(column => {
            if (column.field === "subscription_id") {
              return {
                ...column,
                render: (value, row) => {
                  if (!value) return "No Subscription";
                  
                  const subscription = subscriptionsData.find(sub => sub.id === value);
                  if (!subscription) return `ID: ${value}`;
                  
                  return subscription.plan_name || subscription.name || `Subscription ${value}`;
                }
              };
            }
            
            if (column.field === "allowed_book") {
              return {
                ...column,
                render: (value, row) => {

                  if (value !== null && value !== undefined && value !== "") {
                    return `${value}`;
                  }
                  

                  if (row.subscription_id) {
                    const subscription = subscriptionsData.find(sub => sub.id === row.subscription_id);
                    if (subscription && subscription.allowed_books) {
                      return `${subscription.allowed_books} `;
                    }
                  }
                  
                
                }
              };
            }
            
            return column;
          }),
          

          onSubmit: async (formData, setFormData) => {
            console.log("Submitting form data:", formData);
            

            if (!formData.user_id) {
              alert("Please select a user");
              return false;
            }


            if (!formData.card_number) {
              try {
                const response = await DataApi.autoConfigCard();
                if (response?.data?.card_number) {
                  formData.card_number = response.data.card_number;
                } else {

                  formData.card_number = `LIB${Date.now().toString().slice(-8)}`;
                }
              } catch (error) {
                console.error("Error generating card number:", error);
                formData.card_number = `LIB${Date.now().toString().slice(-8)}`;
              }
            }


            formData.isbn_code = generateDefaultISBN({ id: formData.card_number });


            if (!formData.registration_date) {
              formData.registration_date = new Date().toISOString().split('T')[0];
            }

            try {
              console.log("Sending data to API:", formData);
              const response = await DataApi.createLibraryCard(formData);

              if (!response?.data?.success) {
                const errorMsg = response?.data?.message || 'Failed to create library card';
                console.error("API Error:", response);
                alert(errorMsg);
                return false;
              }

              const newCard = response.data.data;
              console.log("Card created successfully:", newCard);
              

              handleModalOpen(newCard);
              

              if (setFormData) {
                setFormData(baseConfig.initialFormData || {});
              }

              return true;
            } catch (err) {
              console.error("Error creating card:", err);
              alert(`Error creating library card: ${err.message}`);
              return false;
            }
          },
          

          customHandlers: {
            ...baseConfig.customHandlers,
            handleBarcodePreview: handleModalOpen,
            formatDateToDDMMYYYY: formatDate,
            generateISBN13Number: generateDefaultISBN,
            

            getSubscriptionOptions: () => {
              return subscriptionsData.map(sub => ({
                value: sub.id,
                label: `${sub.plan_name || sub.name} (${sub.allowed_books || 5} books)`,
                data: sub
              }));
            },
            
            getUserOptions: () => {
              return usersData.map(user => ({
                value: user.id,
                label: `${user.first_name || ''} ${user.last_name || ''} - ${user.email || ''}`,
                data: user
              }));
            },
            

            onDataLoad: (data) => {
              console.log("Transforming table data:", data?.length);
              
              if (!Array.isArray(data)) return data;
              
              return data.map(item => {
                const enhancedItem = { ...item };
                

                if (item.subscription_id && subscriptionsData.length > 0) {
                  const subscription = subscriptionsData.find(sub => sub.id === item.subscription_id);
                  if (subscription) {
                    enhancedItem.subscription_name = subscription.plan_name || subscription.name;
                    enhancedItem.subscription_allowed_books = subscription.allowed_books;
                    

                    if (item.allowed_book !== null && item.allowed_book !== undefined && item.allowed_book !== "") {
                      enhancedItem.allowed_books_effective = item.allowed_book;
                      enhancedItem.allowed_books_source = "Card Override";
                    } else if (subscription.allowed_books !== null && subscription.allowed_books !== undefined) {
                      enhancedItem.allowed_books_effective = subscription.allowed_books;
                      enhancedItem.allowed_books_source = "Subscription";
                    } else {
                      enhancedItem.allowed_books_effective = 5;
                      enhancedItem.allowed_books_source = "System Default";
                    }
                  }
                }
                

                if (item.user_id && usersData.length > 0) {
                  const user = usersData.find(u => u.id === item.user_id);
                  if (user) {
                    enhancedItem.user_name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    enhancedItem.user_email = user.email;
                  }
                }
                

                if (item.registration_date) {
                  enhancedItem.registration_date_formatted = formatDate(item.registration_date);
                }
                if (item.issue_date) {
                  enhancedItem.issue_date_formatted = formatDate(item.issue_date);
                }
                
                return enhancedItem;
              });
            }
          },
          

          validationRules: (formData, allCards, editingCard) => {
            const errors = {};
            
            if (!formData.user_id) {
              errors.user_id = "Please select a user";
            }
            
            if (formData.subscription_id) {
              const subscription = subscriptionsData.find(sub => sub.id === formData.subscription_id);
              if (!subscription) {
                errors.subscription_id = "Selected subscription is invalid";
              }
            }
            

            const existingCard = allCards?.find(
              card => card.user_id === formData.user_id && 
              card.is_active && 
              card.id !== editingCard?.id
            );
            
            if (existingCard) {
              errors.user_id = "This user already has an active library card";
            }
            
            return errors;
          },
          

          beforeSubmit: (formData, isEditing) => {
            const errors = [];
            
            if (!formData.user_id) {
              errors.push("Please select a user");
            }
            
            if (!formData.card_number) {
              errors.push("Card number is required");
            }
            
            if (formData.image && formData.image.size > 2 * 1024 * 1024) {
              errors.push("Image size must be less than 2MB");
            }
            

            if (formData.allowed_book !== null && formData.allowed_book !== undefined && formData.allowed_book !== "") {
              const allowedBooks = parseInt(formData.allowed_book);
              if (isNaN(allowedBooks) || allowedBooks < 0) {
                errors.push("Allowed books must be a positive number");
              }
            }
            
            return errors;
          }
        };
        
        console.log("Final configuration built successfully");
        setFinalConfig(final);
        
      } catch (error) {
        console.error("Error building final config:", error);
        setConfigError("Failed to build configuration");
      }
    };
    
    buildFinalConfig();
  }, [baseConfig, subscriptionsData, usersData, loadingConfig]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getLibraryCardConfig();
        setBaseConfig(config);
      } catch (error) {
        console.error("Error fetching library card config:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (data && baseConfig) {
      const buildFinalConfig = async () => {
        try {
          const allData = { ...(data || {}), ...props };
          const config = await getLibraryCardConfig(allData);
          const final = {
            ...config,
            onSubmit: async (formData, setFormData) => {
              if (!formData.user_id) {
                alert("Please select a user");
                return false;
              }

              if (!formData.card_number) {
                const cardNumber = await handleAutoConfig(setFormData);
                if (!cardNumber) return false;
              }

              formData.isbn_code = generateDefaultISBN({ id: formData.card_number });

              try {
                const response = await DataApi.createLibraryCard(formData);

                if (!response?.data?.success || !response.data.data) {
                  alert("Failed to create library card");
                  return false;
                }

                const newCard = response.data.data;

                handleModalOpen(newCard);

                if (setFormData) setFormData({});

                return true;
              } catch (err) {
                console.error("Error creating card:", err);
                alert("Error creating library card");
                return false;
              }
            },

            customHandlers: {
              ...config.customHandlers,
              handleBarcodePreview: handleModalOpen,
              formatDateToDDMMYYYY: formatDate,
              generateISBN13Number: generateDefaultISBN
            }
          };
          setFinalConfig(final);
        } catch (error) {
          console.error("Error building final config:", error);
        }
      };
      buildFinalConfig();
    }
  }, [data, baseConfig, props]);

  useEffect(() => {
    if (showBarcodeModal && selectedCard) {
      const timer = setTimeout(() => initializeModalBarcode(), 500);
      return () => clearTimeout(timer);
    }
  }, [showBarcodeModal, selectedCard]);

  const handleModalOpen = (card) => {
    console.log("Opening barcode modal for card:", card);
    setSelectedCard(card);
    setBarcodeError(null);
    setShowBarcodeModal(true);
  };

  const handleModalClose = () => {
    setShowBarcodeModal(false);
    setSelectedCard(null);
    setBarcodeError(null);
  };

  const initializeModalBarcode = () => {
    if (!selectedCard || !showBarcodeModal) return;

    const cardNumber = selectedCard.card_number || "N/A";
    if (!cardNumber || cardNumber === "N/A") {
      setBarcodeError("Cannot generate barcode: card number missing");
      return;
    }

    const barcodeElement = document.getElementById(`barcode-modal-${selectedCard.id}`);
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

  const handleAutoConfig = async (setFormData) => {
    try {
      const response = await DataApi.autoConfigCard();
      if (response?.data?.card_number) {
        setFormData(prev => ({ ...prev, card_number: response.data.card_number }));
        return response.data.card_number;
      }
      return null;
    } catch (err) {
      console.error("Auto-config failed:", err);
      return null;
    }
  };

  const generateDefaultISBN = (card) => {
    try {
      const cardId = card.id || "000000000";
      const numericPart = cardId.replace(/\D/g, '').padEnd(9, '0').substring(0, 9);
      const baseNumber = "978" + numericPart;
      const isbn12 = (baseNumber + "000").slice(0, 12);
      let sum = 0;
      for (let i = 0; i < 12; i++) sum += (i % 2 === 0 ? parseInt(isbn12[i]) : parseInt(isbn12[i]) * 3);
      const checkDigit = ((10 - (sum % 10)) % 10).toString();
      return isbn12 + checkDigit;
    } catch {
      return "9780000000000";
    }
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

  const generateCardNumber = (card) => card.card_number || 'N/A';

  if (loading || !finalConfig) return <Loader message="Loading library cards data..." />;
  if (error) return (
    <div className="alert alert-danger m-3">
      <h4>Error Loading Library Cards</h4>
      <p>{error.message}</p>
      <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );


  if (loadingConfig) {
    return <Loader message="Loading library card configuration..." />;
  }
  if (configError) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Configuration Error</h4>
        <p>{configError}</p>
        <button className="btn btn-primary mt-2" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!finalConfig) {
    return <Loader message="Finalizing configuration..." />;
  }

  return (
    <>
      <DynamicCRUD 
        {...finalConfig} 
        icon="fa-solid fa-id-card"

        subscriptionsData={subscriptionsData}
        usersData={usersData}
      />

      {/* Barcode Modal */}
      <Modal show={showBarcodeModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header 
          closeButton 
          style={{ 
            background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)", 
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
              border: "2px solid #6f42c1", 
              borderRadius: "10px", 
              padding: "20px", 
              maxWidth: "500px", 
              margin: "0 auto" 
            }}>
              {/* User Image */}
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
                      border: '3px solid #6f42c1' 
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
                    border: '3px solid #6f42c1' 
                  }}>
                    <i className="fa-solid fa-user" style={{ fontSize: "32px", color: "#6f42c1" }}></i>
                  </div>
                )}
              </div>

              {/* User Information */}
              <div style={{ 
                background: "#f8f9fa", 
                padding: "15px", 
                borderRadius: "8px", 
                marginBottom: "20px" 
              }}>
                <p><strong>Card No:</strong> {generateCardNumber(selectedCard)}</p>
                <p><strong>Name:</strong> {selectedCard.first_name || 'N/A'} {selectedCard.last_name || ''}</p>
                <p><strong>Email:</strong> {selectedCard.email || 'N/A'}</p>
                <p><strong>Registration Date:</strong> {formatDate(selectedCard.registration_date)}</p>
                <p><strong>Subscription:</strong> {selectedCard.subscription_name || 'No Subscription'}</p>
                <p><strong>Allowed Books:</strong> {selectedCard.allowed_books_effective || selectedCard.allowed_book || '5'}</p>
                <p><strong>Status:</strong> 
                  <span style={{ 
                    color: selectedCard.is_active ? "green" : "gray", 
                    fontWeight: "bold",
                    marginLeft: "5px"
                  }}>
                    {selectedCard.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>

              {/* Barcode Error */}
              {barcodeError && (
                <Alert variant="warning" className="mb-3">
                  {barcodeError}
                </Alert>
              )}

              {/* Barcode Display */}
              <div style={{ 
                border: "1px solid #ddd", 
                padding: "15px", 
                background: "white", 
                textAlign: "center", 
                marginBottom: "15px", 
                borderRadius: "8px" 
              }}>
                <svg 
                  id={`barcode-modal-${selectedCard.id}`} 
                  style={{ width: '100%', height: '70px', display: 'block' }}
                ></svg>
                <div style={{ 
                  marginTop: "10px", 
                  fontSize: "14px", 
                  fontWeight: "600", 
                  color: "#6f42c1", 
                  fontFamily: "monospace" 
                }}>
                  {generateCardNumber(selectedCard)}
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ 
                textAlign: "center", 
                fontSize: "12px", 
                color: "#666", 
                marginTop: "15px" 
              }}>
                <p style={{ margin: 0 }}>Scan barcode to verify membership</p>
                <p style={{ margin: "5px 0 0 0" }}>
                  Generated: {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button 
              variant="outline-success" 
              onClick={() => handleDownloadBarcode(selectedCard, API_BASE_URL, generateCardNumber, setBarcodeError, formatDate)} 
              className="me-2"
            >
              <i className="fa-solid fa-download me-1"></i> Download
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={() => handlePrintBarcode(selectedCard, API_BASE_URL, generateCardNumber, formatDate, setBarcodeError)} 
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