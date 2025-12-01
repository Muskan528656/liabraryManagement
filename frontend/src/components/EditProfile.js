import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Container, Row, Badge } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Image from "react-bootstrap/Image";
import Modal from "react-bootstrap/Modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NameInitialsAvatar } from "react-name-initials-avatar"; // npm install react-name-initials-avatar --force
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
import PubSub from "pubsub-js";
import JsBarcode from "jsbarcode";
import axios from "axios";
import { COUNTRY_CODES } from "../constants/COUNTRY_CODES";
const EditProfile = ({ userId }) => {
  const fileInputRef = useRef();
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    whatsapp_number: "",
  });
  const [body, setBody] = useState();
  const [user, setUser] = useState({ password: "", confirmpassword: "" });
  const [selectedFiles, setSelectedFiles] = useState(null);


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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const phoneRegex = /^[0-9]{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [emailChange, setEmailChange] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [brokenImages, setBrokenImages] = useState([]);
  const [libraryCard, setLibraryCard] = useState(null);
  const [showLibraryCardModal, setShowLibraryCardModal] = useState(false);
  const barcodeRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {

        const token = sessionStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decoded = jwt_decode(token);
        const userId = decoded.id;

        if (!userId) {
          console.error("User ID not found in token");
          return;
        }


        const userApi = new DataApi("user");
        const userResponse = await userApi.fetchById(userId);

        if (userResponse && userResponse.data) {
          let result = userResponse.data;


          if (result.whatsapp_number) {
            result.whatsapp_number =
              result.whatsapp_number.length === 12 &&
                result.whatsapp_number.startsWith("91")
                ? result.whatsapp_number.slice(2)
                : result.whatsapp_number;
          }


          setProfile({
            id: result.id,
            firstname: result.firstname || "",
            lastname: result.lastname || "",
            email: result.email || "",
            whatsapp_number: result.whatsapp_number || "",
            country_code: result.country_code || "+91",
          });


          if (result.id) {
            setBody(profileImg + "/" + result.id);
          }


          try {
            const cardApi = new DataApi("librarycard");

            let cardResponse = null;
            try {
              cardResponse = await cardApi.get(`/student/${result.id}`);
            } catch (err) {
              try {
                cardResponse = await cardApi.get(`/user/${result.id}`);
              } catch (err2) {
                console.error("Error fetching library card:", err2);
              }
            }
            if (cardResponse && cardResponse.data) {
              setLibraryCard(cardResponse.data);
            }
          } catch (error) {
            console.error("Error fetching library card:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data. Please try again.");
      }
    }
    init();
  }, [profileImg]);

  useEffect(() => {
    if (showLibraryCardModal && libraryCard && libraryCard.card_number) {
      setTimeout(() => {
        try {
          if (barcodeRef.current) {

            barcodeRef.current.innerHTML = '';

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
              textAlign: "center",
              textPosition: "bottom",
              textMargin: 2,
              valid: function (valid) {
                if (!valid) {
                  console.error("Invalid barcode data");
                }
              }
            });
          }
        } catch (error) {
          console.error("Error generating barcode:", error);
        }
      }, 100);
    }
  }, [showLibraryCardModal, libraryCard]);

  const handlePasswordOnchange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }

    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const isSubmitDisabled = () => {
    return (
      !password ||
      !confirmPassword ||
      password !== confirmPassword ||
      password.length < 8 ||
      password.length > 16
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmailChange(true);
      setEmailError(!emailRegex.test(value) ? "Invalid email format." : "");
    }
    if (name === "whatsapp_number") {
      if (!phoneRegex.test(value)) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
    }
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (!profile.id) {
        toast.error("User ID not found. Please refresh the page.");
        return;
      }


      profile.country_code = profile.country_code
        ? String(profile.country_code).trim()
        : "+91";
      if (!profile.country_code.startsWith("+")) {
        profile.country_code = `+${profile.country_code}`;
      }

      if (selectedFiles === null) {

        const userApi = new DataApi("user");
        const updateData = {
          firstname: profile.firstname,
          lastname: profile.lastname,
          email: profile.email,
          whatsapp_number: profile.whatsapp_number,
          country_code: profile.country_code,
        };

        const result = await userApi.update(updateData, profile.id);

        if (result.data && result.data.success !== false) {
          if (emailChange) {
            setTimeout(() => {
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("user");
              window.location.href = "/login";
            }, 2000);
          }

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Profile updated successfully",
          });
        } else {
          toast.error(result.data?.errors || "Failed to update profile");
        }
      } else {

        try {

          const formData = new FormData();
          formData.append('file', selectedFiles);

          const token = sessionStorage.getItem('token');


          const uploadResponse = await axios.post(
            `${COUNTRY_CODES.API_BASE_URL}/api/user/${profile.id}/upload-image`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: token,
              },
            }
          );

          if (uploadResponse.data && uploadResponse.data.success) {

            const userApi = new DataApi("user");
            const updateData = {
              firstname: profile.firstname,
              lastname: profile.lastname,
              email: profile.email,
              whatsapp_number: profile.whatsapp_number,
              country_code: profile.country_code,
            };

            const result = await userApi.update(updateData, profile.id);

            if (result.data && result.data.success !== false) {

              const imagePath = `${profileImg}/${profile.id}`;
              sessionStorage.setItem("myimage", imagePath);


              setTimeout(() => {
                window.location.reload();
              }, 1000);

              PubSub.publish("RECORD_SAVED_TOAST", {
                title: "Success",
                message: "Profile and image updated successfully",
              });
            } else {
              toast.error(result.data?.errors || "Failed to update profile");
            }
          } else {
            toast.error("Failed to upload image. Please try again.");
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error("Failed to upload image. Please try again.");


          const userApi = new DataApi("user");
          const updateData = {
            firstname: profile.firstname,
            lastname: profile.lastname,
            email: profile.email,
            whatsapp_number: profile.whatsapp_number,
            country_code: profile.country_code,
          };

          const result = await userApi.update(updateData, profile.id);
          if (result.data && result.data.success !== false) {
            PubSub.publish("RECORD_SAVED_TOAST", {
              title: "Success",
              message: "Profile updated (image upload failed)",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.errors || "Failed to update profile. Please try again.");
    }
  };

  const handlePhotoUpload = (event) => {
    setBody(URL.createObjectURL(event.target.files[0]));
    setSelectedFiles(event.target.files[0]);
    setBrokenImages(URL.createObjectURL(event.target.files[0]));
  };

  const handleChangeSubmit = async (e) => {
    e.preventDefault();

    if (!profile.id) {
      toast.error("User ID not found. Please refresh the page.");
      return;
    }

    try {
      const userApi = new DataApi("user");
      const updateData = {
        password: password,
      };

      const result = await userApi.update(updateData, profile.id);

      if (result.data && result.data.success !== false) {
        PubSub.publish("RECORD_SAVED_TOAST", {
          title: "Success",
          message: "Password updated successfully.",
        });
        setShowPasswordModal(false);
        setPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(result.data?.errors || "Failed to update password.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.errors || "Failed to update password. Please try again.");
    }
  };

  const handleClose = () => {
    setShowPasswordModal(false);
    setPassword("");
    setConfirmPassword("");
  };

  const handleShowPasswordModal = () => {
    setShowPasswordModal(true);
    setPassword("");
    setConfirmPassword("");
  };

  const isFormValid = () => {
    return (
      Boolean(profile.firstname?.trim()) &&
      Boolean(profile.lastname?.trim()) &&
      Boolean(profile.email?.trim()) &&
      Boolean(profile.whatsapp_number?.trim()) &&
      Boolean(profile.whatsapp_number?.length == 10) &&
      phoneRegex.test(profile.whatsapp_number) &&
      !emailError &&
      phoneError === ""
    );
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  return (
    <>
      <Container fluid className="mt-4">
        <Row className="mb-4">
          <Col>
            <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)" }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "15px",
                    }}
                  >
                    <i className="fa-solid fa-user" style={{ fontSize: "24px", color: "white" }}></i>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
                      Update Profile
                    </h4>
                    <p className="text-muted mb-0" style={{ fontSize: "14px" }}>
                      Manage your personal information and account settings
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={4} xs={12} sm={12} className="mb-4">
            <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", height: "100%" }}>
              <Card.Body className="text-center p-4">
                <Card.Title
                  style={{
                    textAlign: "center",
                    color: "#6f42c1",
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px"
                  }}
                >
                  {profile.firstname || ""} {profile.lastname || ""}
                </Card.Title>
                {/* <Image variant="top"
                  src={body}
                  className="rounded-circle"
                  thumbnail
                  style={{ width: "207px", height: "207px", objectFit: "contain" }}></Image> */}

                <div style={{ marginBottom: "20px" }}>
                  {brokenImages.includes(`img-${profile.id}`) ? (
                    <div
                      className="text-uppercase"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <NameInitialsAvatar
                        size="180px"
                        textSize="28px"
                        bgColor="#6f42c1"
                        borderWidth="4px"
                        borderColor="#8b5cf6"
                        textColor="#fff"
                        name={`${profile.firstname} ${profile.lastname}`}
                      />
                    </div>
                  ) : (
                    <Image
                      variant="top"
                      src={body}
                      className="rounded-circle"
                      thumbnail
                      style={{
                        width: "180px",
                        height: "180px",
                        objectFit: "cover",
                        border: "4px solid #e9d5ff",
                        boxShadow: "0 4px 12px rgba(111, 66, 193, 0.2)",
                      }}
                      onError={() =>
                        setBrokenImages((prev) => [...prev, `img-${profile.id}`])
                      }
                      id={`img-${profile.id}`}
                    />
                  )}
                </div>

                <Button
                  className="btn mt-3"
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                    border: "none",
                    padding: "10px",
                    fontWeight: "500"
                  }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="fa-solid fa-upload me-2"></i>
                  Upload Image
                </Button>
                <input
                  onChange={handlePhotoUpload}
                  name="profilephotourl"
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                />

                {/* Library Card Section - Always Show */}
                <div className="mt-4 pt-4" style={{ borderTop: "2px solid #e9ecef" }}>
                  <h6 className="mb-3" style={{ color: "#6f42c1", fontWeight: "600" }}>
                    <i className="fa-solid fa-id-card me-2"></i>
                    Library Card
                  </h6>
                  {libraryCard ? (
                    <div className="p-3" style={{
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px solid #e9ecef"
                    }}>
                      <p className="mb-2">
                        <strong>Card Number:</strong> {libraryCard.card_number}
                      </p>
                      <p className="mb-2">
                        <strong>Status:</strong>{" "}
                        <Badge bg={libraryCard.status === 'active' ? 'success' : 'secondary'}>
                          {libraryCard.status}
                        </Badge>
                      </p>
                      {libraryCard.issue_date && (
                        <p className="mb-2">
                          <strong>Issued:</strong> {new Date(libraryCard.issue_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                      {libraryCard.expiry_date && (
                        <p className="mb-3">
                          <strong>Expires:</strong> {new Date(libraryCard.expiry_date).toLocaleDateString('en-IN')}
                        </p>
                      )}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => setShowLibraryCardModal(true)}
                        style={{
                          borderColor: "#6f42c1",
                          color: "#6f42c1",
                        }}
                      >
                        <i className="fa-solid fa-print me-2"></i>
                        View & Print Card
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 text-center" style={{
                      background: "#f8f9fa",
                      borderRadius: "8px",
                      border: "1px dashed #e9ecef"
                    }}>
                      <p className="text-muted mb-0">
                        <i className="fa-solid fa-info-circle me-2"></i>
                        No library card assigned yet
                      </p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} sm={12} xs={12}>
            <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(111, 66, 193, 0.1)", height: "100%" }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold" style={{ color: "#6f42c1" }}>
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Profile
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleShowPasswordModal}
                    style={{
                      borderColor: "#6f42c1",
                      color: "#6f42c1",
                    }}
                  >
                    <i className="fa-solid fa-key me-2"></i>
                    Change Password
                  </Button>
                </div>

                <Form>
                  <Row>
                    <Col lg={6} sm={12} xs={12}>
                      <Form.Group className="mb-3" controlId="formBasicPhone">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          style={{
                            height: "42px",
                            borderColor: "#e9ecef",
                            borderRadius: "8px",
                          }}
                          required
                          type="text"
                          name="firstname"
                          value={profile.firstname}
                          onChange={handleChange}
                          placeholder="Enter First Name"
                          onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                          onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                        />
                      </Form.Group>
                    </Col>
                    <Col lg={6} sm={12} xs={12}>
                      <Form.Group className="mb-3" controlId="formBasicLastName">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          style={{
                            height: "42px",
                            borderColor: "#e9ecef",
                            borderRadius: "8px",
                          }}
                          required
                          type="text"
                          name="lastname"
                          placeholder="Enter Last Name"
                          value={profile.lastname}
                          onChange={handleChange}
                          onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                          onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                        />
                      </Form.Group>
                    </Col>

                    <Col lg={6} sm={12} xs={12}>
                      <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                          Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          style={{
                            height: "42px",
                            borderColor: emailError ? "#dc3545" : "#e9ecef",
                            borderRadius: "8px",
                          }}
                          required
                          type="email"
                          name="email"
                          placeholder="Enter Email"
                          value={profile.email}
                          onChange={handleChange}
                          onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                          onBlur={(e) => e.target.style.borderColor = emailError ? "#dc3545" : "#e9ecef"}
                        />
                        {emailError && (
                          <small className="text-danger d-block mt-1">
                            <i className="fa-solid fa-exclamation-circle me-1"></i>
                            {emailError}
                          </small>
                        )}
                      </Form.Group>
                    </Col>
                    <Col lg={2} sm={12} xs={12}>
                      <Form.Group className="mb-3" controlId="formBasicPhone">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                          Country Code
                        </Form.Label>
                        <Form.Select
                          style={{
                            height: "42px",
                            borderColor: "#e9ecef",
                            borderRadius: "8px",
                          }}
                          required
                          name="country_code"
                          value={profile.country_code || "+91"}
                          onChange={handleChange}
                          onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                          onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                        >
                          {COUNTRY_CODES.map((country, index) => (
                            <option key={index} value={country.country_code}>
                              {country.country} ({country.country_code})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col lg={4} sm={12} xs={12}>
                      <Form.Group className="mb-3" controlId="formBasicPhone">
                        <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                          WhatsApp Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          style={{
                            height: "42px",
                            borderColor: phoneError ? "#dc3545" : "#e9ecef",
                            borderRadius: "8px",
                          }}
                          required
                          type="phone"
                          name="whatsapp_number"
                          placeholder="Enter Phone Number"
                          value={profile.whatsapp_number}
                          onChange={handleChange}
                          onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                          onBlur={(e) => e.target.style.borderColor = phoneError ? "#dc3545" : "#e9ecef"}
                        />
                        {phoneError && (
                          <small className="text-danger d-block mt-1">
                            <i className="fa-solid fa-exclamation-circle me-1"></i>
                            {phoneError}
                          </small>
                        )}
                      </Form.Group>
                    </Col>

                    <Col lg={12} sm={12} xs={12}>
                      <hr style={{ borderColor: "#e9ecef", margin: "20px 0" }}></hr>
                    </Col>

                    <Col lg={12} sm={12} xs={12} className="text-end">
                      <Button
                        variant="secondary"
                        className="me-2"
                        onClick={() => window.history.back()}
                        style={{
                          borderColor: "#6f42c1",
                          background: "white",
                          color: "#6f42c1",
                          padding: "10px 20px",
                          borderRadius: "8px",
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={!isFormValid()}
                        onClick={handleSubmit}
                        style={{
                          background: isFormValid()
                            ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)"
                            : "#ccc",
                          border: "none",
                          padding: "10px 30px",
                          borderRadius: "8px",
                          fontWeight: "500",
                        }}
                      >
                        <i className="fa-solid fa-save me-2"></i>
                        Save Changes
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Modal
          show={showPasswordModal}
          aria-labelledby="contained-modal-title-vcenter"
          centered
          size="md"
          style={{ borderRadius: "12px" }}
        >
          <Modal.Header
            closeButton
            onClick={handleClose}
            style={{
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              color: "white",
              borderBottom: "none",
            }}
          >
            <Modal.Title id="contained-modal-title-vcenter" style={{ color: "white" }}>
              <i className="fa-solid fa-key me-2"></i>
              Change Password
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: "24px" }}>
            <Row>
              <Col lg={12} sm={12} xs={12}>
                <Form noValidate className="mb-0">
                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                      New Password <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="d-flex align-items-center position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your new password (8-16 characters)"
                        value={password}
                        onChange={handlePasswordOnchange}
                        required
                        style={{
                          height: "42px",
                          borderColor: "#e9ecef",
                          borderRadius: "8px",
                          paddingRight: "40px",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                        onBlur={(e) => e.target.style.borderColor = "#e9ecef"}
                      />
                      <span
                        className="position-absolute end-0 me-3"
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer", color: "#6f42c1" }}
                      >
                        <i
                          className={`fa-solid ${!showPassword ? "fa-eye-slash" : "fa-eye"
                            }`}
                          aria-hidden="true"
                        ></i>
                      </span>
                    </div>
                    {password && password.length < 8 && (
                      <small className="text-warning d-block mt-1">
                        <i className="fa-solid fa-info-circle me-1"></i>
                        Password must be at least 8 characters
                      </small>
                    )}
                  </Form.Group>
                  <Form.Group
                    className="mb-3"
                    controlId="formBasicConfirmPassword"
                  >
                    <Form.Label style={{ fontWeight: "500", color: "#333", marginBottom: "8px" }}>
                      Confirm Password <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="d-flex align-items-center position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmpassword"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={handlePasswordOnchange}
                        required
                        style={{
                          height: "42px",
                          borderColor: confirmPassword && password !== confirmPassword ? "#dc3545" : "#e9ecef",
                          borderRadius: "8px",
                          paddingRight: "40px",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#6f42c1"}
                        onBlur={(e) => e.target.style.borderColor = confirmPassword && password !== confirmPassword ? "#dc3545" : "#e9ecef"}
                      />
                      <span
                        className="position-absolute end-0 me-3"
                        onClick={toggleConfirmPasswordVisibility}
                        style={{ cursor: "pointer", color: "#6f42c1" }}
                      >
                        <i
                          className={`fa-solid ${!showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                            }`}
                          aria-hidden="true"
                        ></i>
                      </span>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <small className="text-danger d-block mt-1">
                        <i className="fa-solid fa-exclamation-circle me-1"></i>
                        Passwords do not match
                      </small>
                    )}
                  </Form.Group>
                </Form>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e9ecef", padding: "16px 24px" }}>
            <div className="d-flex justify-content-end w-100">
              <Button
                variant="secondary"
                onClick={handleClose}
                style={{
                  borderColor: "#6f42c1",
                  background: "white",
                  color: "#6f42c1",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  marginRight: "10px",
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitDisabled()}
                onClick={handleChangeSubmit}
                style={{
                  background: !isSubmitDisabled()
                    ? "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)"
                    : "#ccc",
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: "8px",
                  fontWeight: "500",
                }}
              >
                <i className="fa-solid fa-save me-2"></i>
                Update Password
              </Button>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Library Card Printable Modal */}
        <Modal
          show={showLibraryCardModal}
          onHide={() => setShowLibraryCardModal(false)}
          size="lg"
          centered
        >
          <Modal.Header
            closeButton
            style={{
              background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
              color: "white"
            }}
          >
            <Modal.Title>
              <i className="fa-solid fa-id-card me-2"></i>
              Library Member
            </Modal.Title>
          </Modal.Header>
          <Modal.Body id="library-card-print-content" style={{ padding: "30px" }}>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #library-card-print-content, #library-card-print-content * {
                  visibility: visible;
                }
                #library-card-print-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  padding: 20px !important;
                }
                .no-print {
                  display: none !important;
                }
                .library-card-container {
                  border: 3px solid #6f42c1 !important;
                  padding: 30px !important;
                  background: white !important;
                }
                #library-card-barcode {
                  display: block !important;
                  margin: 0 auto !important;
                }
                #library-card-barcode svg {
                  max-width: 100% !important;
                  height: auto !important;
                }
              }
            `}</style>
            {libraryCard && (
              <div
                className="library-card-container"
                style={{
                  border: "3px solid #6f42c1",
                  borderRadius: "12px",
                  padding: "30px",
                  background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                  boxShadow: "0 4px 12px rgba(111, 66, 193, 0.2)"
                }}
              >
                <div className="text-center mb-4">
                  <h3 style={{ color: "#6f42c1", fontWeight: "bold", marginBottom: "10px" }}>
                    Library Card
                  </h3>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "36px",
                    fontWeight: "bold"
                  }}>
                    {profile.firstname?.charAt(0)}{profile.lastname?.charAt(0)}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <strong style={{ color: "#6f42c1" }}>Name:</strong>
                  </div>
                  <div className="col-6">
                    {profile.firstname} {profile.lastname}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <strong style={{ color: "#6f42c1" }}>Email:</strong>
                  </div>
                  <div className="col-6">
                    {profile.email}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <strong style={{ color: "#6f42c1" }}>Card Number:</strong>
                  </div>
                  <div className="col-6">
                    <strong style={{ fontSize: "18px", color: "#6f42c1" }}>
                      {libraryCard.card_number}
                    </strong>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-6">
                    <strong style={{ color: "#6f42c1" }}>Status:</strong>
                  </div>
                  <div className="col-6">
                    <Badge bg={libraryCard.status === 'active' ? 'success' : 'secondary'}>
                      {libraryCard.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {libraryCard.issue_date && (
                  <div className="row mb-3">
                    <div className="col-6">
                      <strong style={{ color: "#6f42c1" }}>Issued Date:</strong>
                    </div>
                    <div className="col-6">
                      {new Date(libraryCard.issue_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {libraryCard.expiry_date && (
                  <div className="row mb-3">
                    <div className="col-6">
                      <strong style={{ color: "#6f42c1" }}>Expiry Date:</strong>
                    </div>
                    <div className="col-6">
                      {new Date(libraryCard.expiry_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {/* Barcode Section */}
                <div className="row mb-3 mt-4">
                  <div className="col-12">
                    <div className="text-center" style={{
                      padding: "15px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e9ecef"
                    }}>
                      <strong style={{ color: "#6f42c1", display: "block", marginBottom: "10px", fontSize: "14px" }}>
                        Library Card Barcode
                      </strong>
                      <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "10px",
                        background: "#ffffff"
                      }}>
                        <div style={{ maxWidth: "100%", overflow: "hidden" }}>
                          <svg
                            ref={barcodeRef}
                            id="library-card-barcode"
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              display: "block"
                            }}
                          ></svg>
                        </div>
                      </div>
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "#6f42c1", fontWeight: "600" }}>
                        {libraryCard.card_number}
                      </div>
                      <small className="text-muted" style={{ display: "block", marginTop: "5px", fontSize: "10px" }}>
                        Scan barcode to retrieve card information
                      </small>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4 pt-3" style={{ borderTop: "2px solid #e9ecef" }}>
                  <small className="text-muted">
                    This card is the property of the Library Management System
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="no-print">
            <Button
              variant="secondary"
              onClick={() => setShowLibraryCardModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                window.print();
              }}
              style={{
                background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                border: "none"
              }}
            >
              <i className="fa-solid fa-print me-2"></i>
              Print Card
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <ToastContainer />
    </>
  );
};

export default EditProfile;
