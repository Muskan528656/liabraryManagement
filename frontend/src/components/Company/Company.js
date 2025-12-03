import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import DataApi from '../../api/dataApi';
import PubSub from 'pubsub-js';
import { COUNTRY_CODES } from "../../constants/COUNTRY_CODES";
import { TIME_ZONE } from "../../constants/TIME_ZONE"
import { CURRENCY } from '../../constants/CURRENCY';

const Company = () => {
  const [Company, setCompany] = useState({
    name: "",
    tenantcode: "",
    userlicenses: 0,
    isactive: false,
    systememail: "",
    adminemail: "",
    phone_number: "",
    logourl: "",
    sidebarbgurl: "",
    sourceschema: "",
    city: "",
    street: "",
    pincode: "",
    state: "",
    country: "",
    country_code: "",
    platform_name: "",
    platform_api_endpoint: "",
    is_external: false,
    has_wallet: false,
    currency: "",
    time_zone: "",
    country_code: "",
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState({ ...Company });
  const [countryCodeList, setCountryCodeList] = useState([]);
  const [countryCodeDisplay, setCountryCodeDisplay] = useState("");
  const [combinedPhone, setCombinedPhone] = useState("");

  useEffect(() => {
    fetchCompany();
    fetchCountryCodesList();
  }, []);

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }

  const fetchCountryCodesList = async () => {
    try {
      const companyApi = new DataApi("company");
      // Call the picklist endpoint
      const response = await companyApi.fetchAll("picklist/country-codes");
      
      if (response.data) {
        setCountryCodeList(response.data);
        console.log("Country Codes List:", response.data);
      }
    } catch (error) {
      console.error("Error fetching country codes list:", error);
      // Fallback to local JSON if API fails
      setCountryCodeList(
        COUNTRY_CODES.map((item) => ({
          id: item.country_code,
          name: `${item.country} (${item.country_code})`,
          country: item.country,
          country_code: item.country_code
        }))
      );
    }
  };

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
        
        // Set country code display from API response
        if (response.data.country_code_display) {
          setCountryCodeDisplay(response.data.country_code_display);
        } else if (response.data.country_code) {
          const countryInfo = COUNTRY_CODES.find(c => c.country_code === response.data.country_code);
          if (countryInfo) {
            setCountryCodeDisplay(`${countryInfo.country} (${countryInfo.country_code})`);
          }
        }
        
        // Set combined phone number (country code + phone)
        if (response.data.country_code && response.data.phone_number) {
          setCombinedPhone(`${response.data.country_code}${response.data.phone_number}`);
        } else if (response.data.phone_number) {
          setCombinedPhone(response.data.phone_number);
        }
        
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
      console.log("tempCompanytempCompany", tempCompany)
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
    
    // Update combined phone when country code or phone number changes
    if (key === "country_code" || key === "phone_number") {
      const countryCode = key === "country_code" ? value : tempCompany.country_code;
      const phoneNumber = key === "phone_number" ? value : tempCompany.phone_number;
      
      if (countryCode && phoneNumber) {
        setCombinedPhone(`${countryCode}${phoneNumber}`);
      } else if (phoneNumber) {
        setCombinedPhone(phoneNumber);
      } else {
        setCombinedPhone("");
      }
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>

          <Card className="border-0 shadow-sm detail-h4">
            <Card.Body>
              <div
                className="d-flex justify-content-between align-items-center mb-4 p-2"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}
              >
                <h5 className="fw-bold mb-1" style={{ color: "var(--primary-color)" }}>
                  <i className="fa-solid fa-store me-2"></i>
                  Company
                </h5>
                {!isEditingCompany ? (
                  <button

                    className="custom-btn-primary"
                    onClick={handleCompanyEdit}
                  >
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Company
                  </button>
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
                  <h6
                    className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                    style={{
                      color: "var(--primary-color)",
                      background: "var(--header-highlighter-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Company Information
                  </h6>
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

                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Phone Number</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter phone number (without country code)"
                            value={
                              isEditingCompany
                                ? tempCompany.phone_number || ""
                                : Company.phone_number || ""
                            }
                            readOnly={!isEditingCompany}
                            onChange={(e) =>
                              isEditingCompany &&
                              handleCompanyChange("phone_number", e.target.value)
                            }
                            style={{
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
                          <Form.Select
                            value={isEditingCompany ? tempCompany.currency : (Company.currency || "")}
                            onChange={(e) =>
                              isEditingCompany && handleCompanyChange("currency", e.target.value)
                            }
                            disabled={!isEditingCompany}
                            style={{
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          >
                            <option value="">Select Currency</option>

                            {CURRENCY.map((c) => (
                              <option key={c.label} value={c.value}>
                                {c.label} — {c.value}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Time Zone</Form.Label>
                          <Form.Select
                            value={isEditingCompany ? tempCompany.time_zone : (Company.time_zone || "")}
                            onChange={(e) =>
                              isEditingCompany && handleCompanyChange("time_zone", e.target.value)
                            }
                            disabled={!isEditingCompany}
                            style={{
                              pointerEvents: isEditingCompany ? "auto" : "none",
                              opacity: isEditingCompany ? 1 : 0.9,
                            }}
                          >
                            <option value="">Select TimeZone</option>

                            {TIME_ZONE.map((c) => (
                              <option key={c.label} value={c.value}>
                                {c.label} — {c.value}
                              </option>
                            ))}
                          </Form.Select>
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
                  <h6
                    className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                    style={{
                      color: "var(--primary-color)",
                      background: "var(--header-highlighter-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Address Information
                  </h6>
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

                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Country Code</Form.Label>
                      <Form.Select
                        value={isEditingCompany ? tempCompany.country_code : (Company.country_code || "")}
                        onChange={(e) =>
                          isEditingCompany && handleCompanyChange("country_code", e.target.value)
                        }
                        disabled={!isEditingCompany}
                        style={{
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      >
                        <option value="">Select Country Code</option>

                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.country_code} — {c.country}
                          </option>
                        ))}
                      </Form.Select>
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

                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Country Code</Form.Label>
                      {isEditingCompany ? (
                        <Form.Select
                          value={tempCompany.country_code || ""}
                          onChange={(e) =>
                            handleCompanyChange("country_code", e.target.value)
                          }
                          style={{
                            pointerEvents: isEditingCompany ? "auto" : "none",
                            opacity: isEditingCompany ? 1 : 0.9,
                          }}
                        >
                          <option value="">Select Country Code</option>
                          {COUNTRY_CODES.map((item) => (
                            <option key={item.country_code} value={item.country_code}>
                              {item.country} ({item.country_code})
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        <Form.Control
                          type="text"
                          value={
                            Company.country_code
                              ? `${COUNTRY_CODES.find(c => c.country_code === Company.country_code)?.country} (${Company.country_code})` || Company.country_code
                              : ""
                          }
                          readOnly
                          style={{
                            pointerEvents: "none",
                            opacity: 0.9,
                          }}
                        />
                      )}
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
