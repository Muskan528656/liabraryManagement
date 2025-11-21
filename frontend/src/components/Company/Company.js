import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert} from 'react-bootstrap';
import DataApi from '../../api/dataApi';
import PubSub from 'pubsub-js';

const Company = () => {
  const [Company, setCompany] = useState({
    name: "",
    tenantcode: "",
    userlicenses: 0,
    isactive: false,
    systememail: "",
    adminemail: "",
    logourl: "",
    sidebarbgurl: "",
    sourceschema: "",
    city: "",
    street: "",
    pincode: "",
    state: "",
    country: "",
    platform_name: "",
    platform_api_endpoint: "",
    is_external: false,
    has_wallet: false,
    currency: "",
    time_zone:"",
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState({ ...Company });

  useEffect(() => {
    fetchCompany();
  }, []);

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }

  const fetchCompany = async () => {
    try {
      const companyid = getCompanyIdFromToken();

      if (!companyid) {
        console.error("Company ID not found in token");
        return;
      }

      const companyApi = new DataApi("company");
      const response = await companyApi.fetchById(companyid);

      if (response.data) {
        setCompany(response.data);
        console.log("Company:", response.data);
      }
    } catch (error) {
      console.error("Error fetching company by ID:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch company details",
      });
    }
  };

  const handleCompanyEdit = () => {
    setIsEditingCompany(true);
    setTempCompany({ ...Company });
  };

  const handleCompanySave = async () => {
    try {
      const companyId = getCompanyIdFromToken();
      const companyApi = new DataApi("company");

      const response = await companyApi.update(tempCompany, companyId);

      if (response.data) {
        setCompany({ ...tempCompany });
        setIsEditingCompany(false);
        setAlertMessage("Company details updated successfully!");
        setShowAlert(true);

        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Company details updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error updating company:", error);
      setAlertMessage("Failed to update company details.");
      setShowAlert(true);
    }
  };

  const handleCompanyCancel = () => {
    setIsEditingCompany(false);
    setTempCompany({ ...Company });
  };

  const handleCompanyChange = (key, value) => {
    setTempCompany((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          {showAlert && (
            <Alert
              variant={
                alertMessage.includes("successfully") ? "success" : "danger"
              }
              dismissible
              onClose={() => setShowAlert(false)}
              className="mb-4"
            >
              {alertMessage}
            </Alert>
          )}
          <Card className="border-0 shadow-sm">
            <Card.Body className="">
              <div
                className="d-flex justify-content-between align-items-center mb-4 p-4"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}
              >
                <h2 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>
                  Company
                </h2>
                {!isEditingCompany ? (
                  <Button
                    variant="outline-primary"
                    onClick={handleCompanyEdit}
                    style={{
                      border: "2px solid var(--primary-color)",
                      color: "var(--primary-color)",
                      borderRadius: "8px",
                      padding: "8px 20px",
                      fontWeight: "600",
                    }}
                  >
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Company
                  </Button>
                ) : (
                  <div className="d-flex gap-2">
                    <button
                    className="custom-btn-primary"
                      onClick={handleCompanySave}
                    >
                      <i className="fa-solid fa-check me-2"></i>
                      Save
                    </button>
                    <button
                      className="custom-btn-secondary "
                      onClick={handleCompanyCancel}
                    >
                      <i className="fa-solid fa-times me-2"></i>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <Row className="mt-4">
                <Col md={12} className="mb-4">
                  <h5
                    className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                    style={{
                      color: "var(--primary-color)",
                      background: "var(--header-highlighter-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Company Information
                  </h5>
                </Col>
                <Row className="px-5">
                  <Col md={9}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Company Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={isEditingCompany ? tempCompany.name : Company.name}
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("name", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Tenant Code</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.tenantcode
                                : Company.tenantcode
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("tenantcode", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">User Licenses</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.userlicenses
                                : Company.userlicenses
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("userlicenses", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">System Email</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.systememail
                                : Company.systememail
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("systememail", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Admin Email</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.adminemail
                                : Company.adminemail
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("adminemail", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-semibold">Is Active</Form.Label>
                        <div
                          className="d-flex align-items-center justify-content-between p-2 border rounded"
                          style={{
                            background: "var(--header-highlighter-color)",
                            borderRadius: "10px",
                            opacity: isEditingCompany ? 1 : 0.6,
                            cursor: isEditingCompany ? "pointer" : "not-allowed",
                            transition: "0.2s",
                          }}
                        >
                          <Form.Check
                            type="switch"
                            checked={tempCompany.isactive}
                            disabled={!isEditingCompany}
                            onChange={(e) =>
                              handleCompanyChange("isactive", e.target.checked)
                            }
                            style={{
                              transform: "scale(1.1)",
                            }}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Currency</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.currency
                                : Company.currency
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("currency", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Time Zone</Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany
                                ? tempCompany.time_zone
                                : Company.time_zone
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("time_zone", e.target.value)
                            }
                            style={{
                              background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                  <Col md={3} >
                    <Form.Label className="fw-semibold">Company Logo</Form.Label>
                    <div className="d-flex align-items-center justify-content-center ">
                      <div
                        className="border border-dashed d-flex align-items-center justify-content-center position-relative overflow-hidden"
                        style={{
                          width: "250px",
                          height: "250px",
                          cursor: isEditingCompany ? "pointer" : "default",
                          opacity: isEditingCompany ? 1 : 0.8,
                        }}
                        onClick={() => {
                          if (isEditingCompany) {
                            document.getElementById("companyLogoInput").click();
                          }
                        }}
                      >
                        <img
                          src={
                            tempCompany.logourl
                              ? tempCompany.logourl
                              : Company?.logourl
                              ? `${Company.logourl}?${new Date().getTime()}`
                              : "/default-logo.png"
                          }
                          alt="Company Logo"
                          className="w-100 h-100"
                          style={{
                            objectFit: "cover",
                          }}
                        />

                        {isEditingCompany && (
                          <div className="position-absolute bottom-0 start-0 w-100 text-center bg-dark bg-opacity-50 text-white small py-1">
                            Click to change
                          </div>
                        )}
                      </div>
                      {isEditingCompany && (
                        <Form.Control
                          type="file"
                          accept="image/*"
                          id="companyLogoInput"
                          className="d-none"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const previewUrl = URL.createObjectURL(file);
                              handleCompanyChange("logourl", previewUrl);
                            }
                          }}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </Row>

              <Row className="mt-4">
                <Col md={12} className="mb-4">
                  <h5
                    className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                    style={{
                      color: "var(--primary-color)",
                      background: "var(--header-highlighter-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Address Information
                  </h5>
                </Col>
                <Row className="px-5">
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Country</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany ? tempCompany.country : Company.country
                        }
                        readOnly={!isEditingCompany}
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("country", e.target.value)
                        }
                        style={{
                          background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                   <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">State</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany ? tempCompany.state : Company.state
                        }
                        readOnly={!isEditingCompany}
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("state", e.target.value)
                        }
                        style={{
                          background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">City</Form.Label>
                      <Form.Control
                        type="text"
                        value={isEditingCompany ? tempCompany.city : Company.city}
                        readOnly={!isEditingCompany}
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("city", e.target.value)
                        }
                        style={{
                          background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Pincode</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany ? tempCompany.pincode : Company.pincode
                        }
                        readOnly={!isEditingCompany}
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("pincode", e.target.value)
                        }
                        style={{
                          background: !isEditingCompany ? "var(--header-highlighter-color)" : "white",
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>  
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Company;
