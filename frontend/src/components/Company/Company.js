import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card, Form, Alert } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";
import { Country, State, City } from "country-state-city";
import { COUNTRY_TIMEZONE } from "../../constants/COUNTRY_TIMEZONE";
import { useTimeZone } from "../../contexts/TimeZoneContext";
import axios from "axios";
import { API_BASE_URL } from "../../constants/CONSTANT";

const Company = () => {
  const { timeZone, setCompanyTimeZone } = useTimeZone();



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
    currency_symbol: "",
    time_zone: "",
    country_code: "",
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState({ ...Company });
  const [availableTimeZones, setAvailableTimeZones] = useState([]);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const currentCountryIso = useMemo(() => {
    const countryName = isEditingCompany
      ? tempCompany.country
      : Company.country;
    if (!countryName) return "";
    return allCountries.find((c) => c.name === countryName)?.isoCode || "";
  }, [isEditingCompany, tempCompany.country, Company.country, allCountries]);

  const availableStates = useMemo(() => {
    if (!currentCountryIso) return [];
    return State.getStatesOfCountry(currentCountryIso);
  }, [currentCountryIso]);
  const currentStateIso = useMemo(() => {
    const stateName = isEditingCompany ? tempCompany.state : Company.state;
    if (!stateName) return "";
    return availableStates.find((s) => s.name === stateName)?.isoCode || "";
  }, [isEditingCompany, tempCompany.state, Company.state, availableStates]);

  const availableCities = useMemo(() => {
    if (!currentCountryIso || !currentStateIso) return [];
    return City.getCitiesOfState(currentCountryIso, currentStateIso);
  }, [currentCountryIso, currentStateIso]);

  useEffect(() => {
    fetchCompany();
  }, []);
  useEffect(() => {
    if (currentCountryIso) {
      const countryData = COUNTRY_TIMEZONE.find(
        (c) => c.countryCode === currentCountryIso
      );
      setAvailableTimeZones(countryData ? countryData.timezones : []);
    } else {
      setAvailableTimeZones([]);
    }
  }, [currentCountryIso]);

  function getCompanyIdFromToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.companyid || payload.companyid || null;
  }

  const fetchCompany = async () => {
    try {
      const companyid = getCompanyIdFromToken();
      if (!companyid) return;

      const companyApi = new DataApi("company");
      const response = await companyApi.fetchById(companyid);

      console.log("fetched company response:", response);

      if (response.data) {
        setCompany(response.data);
        setTempCompany(response.data);
        setLogoPreview(response.data.logourl);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch company details",
      });
    }
  };

  const handleCompanySave = async () => {
    try {

      console.log("company to be saved:", tempCompany);
      setIsUploading(true);
      const companyId = getCompanyIdFromToken();
      const token = sessionStorage.getItem("token");

      console.log("selectedLogoFile:", selectedLogoFile);
      if (selectedLogoFile) {
        const formData = new FormData();
        formData.append('logourl', selectedLogoFile);

        console.log("formData:", formData);

        Object.keys(tempCompany).forEach(key => {
          if (key !== 'logourl' && tempCompany[key] !== null && tempCompany[key] !== undefined) {
            // Convert boolean values to strings for FormData compatibility
            const value = typeof tempCompany[key] === 'boolean' ? tempCompany[key].toString() : tempCompany[key];
            formData.append(key, value);
          }
        });

        const companyApi = new DataApi("company");
        const response = await companyApi.updateFormData(formData, companyId);

        if (response.data?.success) {
          const updatedCompany = response.data.data;
          setCompany(updatedCompany);
       
          setTempCompany(updatedCompany);
        

          setIsEditingCompany(false);
          setSelectedLogoFile(null);
          // setLogoPreview(null);
          setAlertMessage("Company details updated successfully!");
          setShowAlert(true);


          setCompanyTimeZone(updatedCompany.time_zone);

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Company details updated successfully!",
          });

          PubSub.publish("COMPANY_UPDATED", { company: updatedCompany });
        }
      } else {

        const companyApi = new DataApi("company");
        const response = await companyApi.update(tempCompany, companyId);

        console.log("update response:", response);
        console.log("companyApi:", companyApi);

        if (response.data) {
          const updatedCompany = response.data.data || response.data;
          setCompany(updatedCompany);
          setTempCompany(updatedCompany);
          setIsEditingCompany(false);
          setAlertMessage("Company details updated successfully!");
          setShowAlert(true);



          if (updatedCompany.time_zone) {
            setCompanyTimeZone(updatedCompany.time_zone);
          }

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Company details updated successfully!",
          });

          PubSub.publish("COMPANY_UPDATED", { company: updatedCompany });
        }
      }
    } catch (error) {
      console.error("Error updating company:", error);
      setAlertMessage("Failed to update company details.");
      setShowAlert(true);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: error.response?.data?.errors || "Failed to update company details",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompanyEdit = () => {
    setIsEditingCompany(true);
    setTempCompany({ ...Company });
  };

  const handleCompanyCancel = () => {
    setIsEditingCompany(false);
    setTempCompany({ ...Company });
    setSelectedLogoFile(null);
    setLogoPreview(null);
  };

  const handleCompanyChange = (key, value) => {
    console.log(`Changing company field ${key} to value:`, value);
    setTempCompany((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCountryUIChange = (e) => {
    const selectedIso = e.target.value;
    const countryObj = allCountries.find((c) => c.isoCode === selectedIso);

    if (countryObj) {
      const tzData = COUNTRY_TIMEZONE.find(
        (c) => c.countryCode === selectedIso
      );

      setTempCompany((prev) => ({
        ...prev,
        country: countryObj.name,
        country_code: `+${countryObj.phonecode}`,
        currency: tzData ? tzData.currency.code : countryObj.currency,
        currency_symbol: tzData ? tzData.currency.symbol : "",
        time_zone:
          tzData && tzData.timezones.length > 0
            ? tzData.timezones[0].zoneName
            : "",
        state: "",
        city: "",
      }));
    }
  };
  const handleStateUIChange = (e) => {
    const selectedStateIso = e.target.value;
    const stateObj = availableStates.find(
      (s) => s.isoCode === selectedStateIso
    );

    if (stateObj) {
      setTempCompany((prev) => ({
        ...prev,
        state: stateObj.name,
        city: "",
      }));
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
                <h5
                  className="fw-bold mb-1"
                  style={{ color: "var(--primary-color)" }}
                >
                  <i className="fa-solid fa-store me-2"></i>
                  Company
                </h5>
                {!isEditingCompany ? (
                  <button
                    className="custom-btn-primary"
                    onClick={handleCompanyEdit}
                  >
                    <i className="fa-solid fa-edit me-2"></i> Edit Company
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button
                      className="custom-btn-primary"
                      onClick={handleCompanySave}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check me-2"></i> Save
                        </>
                      )}
                    </button>
                    <button
                      className="custom-btn-secondary"
                      onClick={handleCompanyCancel}
                      disabled={isUploading}
                    >
                      <i className="fa-solid fa-times me-2"></i> Cancel
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
                      background: "vae(--primary-background-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Company Informationss
                  </h6>
                </Col>
                <Row className="px-5">
                  <Col md={9}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            Company Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={
                              isEditingCompany ? tempCompany.name : Company.name
                            }
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
                          <Form.Label className="fw-semibold">
                            Tenant Code
                          </Form.Label>
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
                          <Form.Label className="fw-semibold">
                            User Licenses
                          </Form.Label>
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
                              handleCompanyChange(
                                "userlicenses",
                                e.target.value
                              )
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
                          <Form.Label className="fw-semibold">
                            System Email
                          </Form.Label>
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
                          <Form.Label className="fw-semibold">
                            Admin Email
                          </Form.Label>
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
                        <Form.Label className="fw-semibold">
                          Is Active
                        </Form.Label>
                        <div
                          className="d-flex align-items-center justify-content-between p-2 border rounded"
                          style={{
                            borderRadius: "10px",
                            opacity: isEditingCompany ? 1 : 0.6,
                            cursor: isEditingCompany
                              ? "pointer"
                              : "not-allowed",
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
                            style={{ transform: "scale(1.1)" }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Col>



                  <Col md={3}>
                    <Form.Label className="fw-semibold">
                      Company Logo
                    </Form.Label>
                    <div className="d-flex align-items-center justify-content-center">
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
                            logoPreview
                              ? logoPreview
                              : Company?.logourl
                                ? Company.logourl.startsWith("http")
                                  ? Company.logourl
                                  : `${API_BASE_URL}${Company.logourl}`
                                : "/Logo.png"
                          }
                          alt="Company Logo"
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.src = "/Logo.png";
                          }}
                        />



                        {isEditingCompany && (
                          <div className="position-absolute bottom-0 start-0 w-100 text-center bg-dark bg-opacity-50 text-white small py-1">
                            {isUploading ? "Uploading..." : "Click to change"}
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
                            console.log("Selected file:", file);
                            if (file) {
                              // File type validation - check both MIME type and extension
                              const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
                              const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

                              const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                              const mimeType = file.type.toLowerCase();

                              console.log('File validation:', {
                                name: file.name,
                                mimeType: mimeType,
                                extension: fileExtension,
                                size: file.size
                              });

                              // Check if MIME type is valid
                              const isValidMimeType = allowedMimeTypes.includes(mimeType);

                              // Check if extension is valid
                              const isValidExtension = allowedExtensions.includes(fileExtension);

                              // Validate that MIME type and extension match appropriately
                              const isValidCombination =
                                (mimeType === 'image/jpeg' && (fileExtension === '.jpg' || fileExtension === '.jpeg')) ||
                                (mimeType === 'image/png' && fileExtension === '.png') ||
                                (mimeType === 'image/gif' && fileExtension === '.gif');

                              if (!isValidMimeType || !isValidExtension || !isValidCombination) {

                                PubSub.publish("RECORD_ERROR_TOAST", {
                                  title: "Error",
                                  message: "Only JPEG, PNG, and GIF images are allowed",
                                });
                                // Reset file input
                                e.target.value = '';
                                return;
                              }

                              if (file.size > 5 * 1024 * 1024) {
                                PubSub.publish("RECORD_ERROR_TOAST", {
                                  title: "Error",
                                  message: "File size must be less than 5MB",
                                });
                                // Reset file input
                                e.target.value = '';
                                return;
                              }

                              setSelectedLogoFile(file);
                              const previewUrl = URL.createObjectURL(file);
                              console.log("previewUrl:", previewUrl);
                              console.log("setselectedLogoFile:", file);
                              setLogoPreview(previewUrl);
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
                      background: "vae(--primary-background-color)",
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
                      <Form.Select
                        value={currentCountryIso}
                        onChange={handleCountryUIChange}
                        disabled={!isEditingCompany}
                        style={{
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      >
                        <option value="">Select Country</option>
                        {COUNTRY_TIMEZONE.map((country) => (
                          <option
                            key={country.countryCode}
                            value={country.countryCode}
                          >
                            {country.countryName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">State</Form.Label>
                      <Form.Select
                        value={currentStateIso}
                        onChange={handleStateUIChange}
                        disabled={!isEditingCompany || !currentCountryIso}
                        style={{
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      >
                        <option value="">Select State</option>
                        {availableStates.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">City</Form.Label>
                      <Form.Select
                        value={
                          isEditingCompany ? tempCompany.city : Company.city
                        }
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("city", e.target.value)
                        }
                        disabled={!isEditingCompany || !currentStateIso}
                        style={{
                          pointerEvents: isEditingCompany ? "auto" : "none",
                          opacity: isEditingCompany ? 1 : 0.9,
                        }}
                      >
                        <option value="">Select City</option>
                        {availableCities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Currency</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany
                            ? tempCompany.currency
                            : Company.currency
                        }
                        readOnly
                        style={{ opacity: 0.9, backgroundColor: "#e9ecef" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Currency Symbol
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany
                            ? tempCompany.currency_symbol
                            : Company.currency_symbol || ""
                        }
                        readOnly
                        style={{
                          opacity: 0.9,
                          backgroundColor: "#e9ecef",
                        }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Time Zone</Form.Label>
                      <Form.Select
                        value={
                          isEditingCompany
                            ? tempCompany.time_zone
                            : Company.time_zone
                        }
                        onChange={(e) =>
                          handleCompanyChange("time_zone", e.target.value)
                        }
                        disabled={!isEditingCompany}
                      >
                        <option value="">Select Time Zone</option>
                        {availableTimeZones.map((zone) => (
                          <option key={zone.zoneName} value={zone.zoneName}>
                            {zone.zoneName} {zone.gmtOffset}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Country Phone Code
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany
                            ? tempCompany.country_code
                            : Company.country_code || ""
                        }
                        readOnly
                        style={{
                          opacity: 0.9,
                          backgroundColor: "#e9ecef",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Street</Form.Label>
                      <Form.Control
                        type="text"
                        value={
                          isEditingCompany ? tempCompany.street : Company.street
                        }
                        readOnly={!isEditingCompany}
                        onChange={(e) =>
                          isEditingCompany &&
                          handleCompanyChange("street", e.target.value)
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
                          isEditingCompany
                            ? tempCompany.pincode
                            : Company.pincode
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
                </Row>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showAlert && (
        <Alert
          variant={alertMessage.includes("success") ? "success" : "danger"}
          onClose={() => setShowAlert(false)}
          dismissible
          className="position-fixed top-0 end-0 m-3"
        >
          {alertMessage}
        </Alert>
      )}
    </Container>
  );
};

export default Company;