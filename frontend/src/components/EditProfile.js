import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Container, Row, Badge, Card, Form, Image, Modal, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NameInitialsAvatar } from "react-name-initials-avatar";
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
import PubSub from "pubsub-js";
import JsBarcode from "jsbarcode";
import axios from "axios";
import { COUNTRY_CODES } from "../constants/COUNTRY_CODES";
import { API_BASE_URL } from "../constants/CONSTANT";

const EditProfile = ({ userId }) => {
  const fileInputRef = useRef();
  const barcodeRef = useRef(null);

  const [profile, setProfile] = useState({
    id: "",
    firstname: "",
    lastname: "",
    email: "",
    whatsapp_number: "",
    country_code: "",
  });
  const [body, setBody] = useState();
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [companyCountryCode, setCompanyCountryCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [brokenImages, setBrokenImages] = useState([]);
  const [libraryCard, setLibraryCard] = useState(null);
  const [showLibraryCardModal, setShowLibraryCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const phoneRegex = /^[0-9]{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let tenantcode = "";
  try {
    const token = sessionStorage.getItem("token");
    if (token) {
      const decoded = jwt_decode(token);
      tenantcode = decoded.tenantcode || decoded.tenant_code || "";
    }
  } catch (error) {
    console.error("Error decoding token:", error);
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  }

  const profileImg = tenantcode ? `/public/${tenantcode}/users` : "";

  const fetCompanyCode = async () => {
    try {
      const companyApi = new DataApi("company");
      const companyResponse = await companyApi.fetchAll();
      if (companyResponse?.data?.data?.length > 0) {
        const companyWithCountryCode = companyResponse.data.data.find(
          (c) => c && c.country_code
        );

        if (companyWithCountryCode && companyWithCountryCode.country_code) {
          const countryCodeStr = String(companyWithCountryCode.country_code).trim();
          const codePart = countryCodeStr.split(/[—\-]/)[0].trim();
          let finalCode = codePart || "";
          if (finalCode && !finalCode.startsWith("+")) {
            finalCode = "+" + finalCode;
          }
          setCompanyCountryCode(finalCode);
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        await fetCompanyCode();

        const token = sessionStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decoded = jwt_decode(token);
        const userIdFromToken = decoded.id;

        if (!userIdFromToken) {
          console.error("User ID not found in token");
          return;
        }

        const userApi = new DataApi("user");
        const userResponse = await userApi.fetchById(userIdFromToken);

        if (userResponse && userResponse.data) {
          let result = userResponse.data.data || userResponse.data;


          let whatsappNumber = result.whatsapp_number || "";
          if (whatsappNumber && whatsappNumber.length === 12 && whatsappNumber.startsWith("91")) {
            whatsappNumber = whatsappNumber.slice(2);
          }


          let userCountryCode = result.country_code || "";
          if (userCountryCode) {
            userCountryCode = String(userCountryCode).trim();
            if (!userCountryCode.startsWith("+")) {
              userCountryCode = "+" + userCountryCode;
            }
          }


          setProfile({
            id: result.id,
            firstname: result.firstname || "",
            lastname: result.lastname || "",
            email: result.email || "",
            whatsapp_number: whatsappNumber,
            country_code: userCountryCode || companyCountryCode || "+91",
          });


          if (result.id) {
            setBody(`${API_BASE_URL}/uploads/users/${result.id}`);
          }


          try {
            const cardApi = new DataApi("librarycard");
            const cardResponse = await cardApi.get(`/user/${result.id}`);
            if (cardResponse?.data) {
              setLibraryCard(cardResponse.data.data || cardResponse.data);
            }
          } catch (error) {
            console.error("Error fetching library card:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (showLibraryCardModal && libraryCard && libraryCard.card_number) {
      setTimeout(() => {
        try {
          if (barcodeRef.current) {
            barcodeRef.current.innerHTML = "";
            const barcodeData = libraryCard.card_number;
            JsBarcode(barcodeRef.current, barcodeData, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 14,
              margin: 5,
              background: "#ffffff",
              lineColor: "#000000",
            });
          }
        } catch (error) {
          console.error("Error generating barcode:", error);
        }
      }, 100);
    }
  }, [showLibraryCardModal, libraryCard]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      if (!emailRegex.test(value)) {
        setEmailError("Invalid email format");
      } else {
        setEmailError("");
      }
    }

    if (name === "whatsapp_number") {

      const numericValue = value.replace(/\D/g, '');

      if (numericValue.length > 10) {
        return;
      }

      if (numericValue && !phoneRegex.test(numericValue)) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }

      setProfile(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      setIsSaving(true);


      const updateData = {
        firstname: profile.firstname.trim(),
        lastname: profile.lastname.trim(),
        email: profile.email.trim(),
        whatsapp_number: profile.whatsapp_number ? `91${profile.whatsapp_number}` : "",
        country_code: profile.country_code || companyCountryCode || "+91",
      };

      const userApi = new DataApi("user");

      if (selectedFiles) {

        const formData = new FormData();
        formData.append("file", selectedFiles);
        Object.entries(updateData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const token = sessionStorage.getItem("token");
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/api/user/${profile.id}/upload-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (uploadResponse.data.success) {
          toast.success("Profile and image updated successfully");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          throw new Error(uploadResponse.data.message || "Image upload failed");
        }
      } else {

        const result = await userApi.update(updateData, profile.id);
        if (result.data.success) {

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Profile updated successfully",
          });
        } else {
          throw new Error(result.data.message || "Update failed");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8 || password.length > 16) {
      toast.error("Password must be 8-16 characters");
      return;
    }

    try {
      const userApi = new DataApi("user");
      const result = await userApi.update({ password }, profile.id);

      if (result.data.success) {
        toast.success("Password updated successfully");
        setShowPasswordModal(false);
        setTimeout(() => {
          sessionStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else {
        throw new Error(result.data.message || "Password update failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setBody(URL.createObjectURL(file));
      setSelectedFiles(file);
    }
  };

  const isFormValid = () => {
    return (
      profile.firstname?.trim() &&
      profile.lastname?.trim() &&
      profile.email?.trim() &&
      emailRegex.test(profile.email) &&
      profile.whatsapp_number?.length === 10 &&
      phoneRegex.test(profile.whatsapp_number) &&
      !emailError &&
      !phoneError
    );
  };

  if (isLoading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
              <Card.Body className="p-4 ">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-3 me-3">
                    <i className="fa-solid fa-user text-primary fs-3"></i>
                  </div>
                  <div>
                    <h2 className="mb-1 fw-bold">My Profile</h2>
                    <p className="mb-0 ">Manage your personal information and settings</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Left Column - Profile Picture & Library Card */}
          <Col lg={4} md={12} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                {/* Profile Picture */}
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    {brokenImages.includes(`img-${profile.id}`) ? (
                      <NameInitialsAvatar
                        size="150px"
                        textSize="36px"
                        bgColor="#667eea"
                        borderWidth="4px"
                        borderColor="#764ba2"
                        textColor="#fff"
                        name={`${profile.firstname} ${profile.lastname}`}
                      />
                    ) : (
                      <Image
                        src={body}
                        roundedCircle
                        className="border border-4"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderColor: "#667eea !important",
                        }}
                        onError={() => setBrokenImages([...brokenImages, `img-${profile.id}`])}
                      />
                    )}
                    <div
                      className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 border border-3 border-white"
                      style={{ cursor: "pointer" }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <i className="fa-solid fa-camera text-white"></i>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <h4 className="mt-3 mb-1 fw-bold">
                    {profile.firstname} {profile.lastname}
                  </h4>
                  <p className="text-muted mb-0">{profile.email}</p>
                </div>

                {/* Library Card Section */}
                <div className="mt-4 pt-4 border-top">
                  <h5 className="fw-bold mb-3">
                    <i className="fa-solid fa-id-card me-2 text-primary"></i>
                    Library Card
                  </h5>
                  {libraryCard ? (
                    <div className="border rounded p-3 bg-light">
                      <Row className="mb-2">
                        <Col xs={6}><strong>Card No:</strong></Col>
                        <Col xs={6} className="text-end">
                          <Badge bg="primary">{libraryCard.card_number}</Badge>
                        </Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={6}><strong>Status:</strong></Col>
                        <Col xs={6} className="text-end">
                          <Badge bg={libraryCard.status === "active" ? "success" : "secondary"}>
                            {libraryCard.status}
                          </Badge>
                        </Col>
                      </Row>
                      <Button
                        variant="outline-primary"
                        className="w-100 mt-2"
                        onClick={() => setShowLibraryCardModal(true)}
                      >
                        <i className="fa-solid fa-print me-2"></i>
                        View & Print Card
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded bg-light">
                      <i className="fa-solid fa-id-card fs-1 text-muted mb-3"></i>
                      <p className="text-muted mb-0">No library card assigned</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Edit Form */}
          <Col lg={8} md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">
                    <i className="fa-solid fa-user-edit me-2 text-primary"></i>
                    Edit Profile
                  </h4>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="fa-solid fa-key me-2"></i>
                    Change Password
                  </Button>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">First Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="firstname"
                        value={profile.firstname}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Last Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="lastname"
                        value={profile.lastname}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Email <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                        isInvalid={!!emailError}
                      />
                      <Form.Control.Feedback type="invalid">
                        {emailError}
                      </Form.Control.Feedback>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label className="fw-semibold">Country Code</Form.Label>
                      <Form.Select
                        name="country_code"
                        value={profile.country_code}
                        onChange={handleChange}
                      >
                        <option value="">Select Code</option>
                        {COUNTRY_CODES.map((country, index) => (
                          <option key={index} value={country.country_code}>
                            {country.country_code} ({country.country})
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label className="fw-semibold">
                        WhatsApp Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="whatsapp_number"
                        value={profile.whatsapp_number}
                        onChange={handleChange}
                        placeholder="10 digit number"
                        maxLength={10}
                        required
                        isInvalid={!!phoneError}
                      />
                      <Form.Control.Feedback type="invalid">
                        {phoneError}
                      </Form.Control.Feedback>
                    </Col>

                    <Col xs={12} className="mt-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="light"
                          type="button"
                          onClick={() => window.history.back()}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={!isFormValid() || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-save me-2"></i>
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa-solid fa-key me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                  maxLength={16}
                  required
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">8-16 characters</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  isInvalid={confirmPassword && password !== confirmPassword}
                />
                <Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </Button>
              </InputGroup>
              {confirmPassword && password !== confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  Passwords do not match
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={!password || !confirmPassword || password !== confirmPassword}>
                Update Password
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Library Card Modal (keep as is) */}
      <Modal show={showLibraryCardModal} onHide={() => setShowLibraryCardModal(false)} size="lg" centered>
        {/* ... existing library card modal content ... */}
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default EditProfile;