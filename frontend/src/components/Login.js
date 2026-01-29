import React, { useState, useEffect } from "react";
import { Alert, Col, Container, Row, Modal } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import AuthApi from "../api/authApi";
import Loader from "./common/Loader";
import "../App.css";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    tcode: "",
  });
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotTcode, setForgotTcode] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const colors = {
    navy: "#1a4073",
    periwinkle: "#6c8dbf",
    bgLight: "#f8f9fa"
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setShowResetModal(true);
    }
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotTcode) { setForgotError("Please fill all required fields"); return; }
    if (!emailRegex.test(forgotEmail)) { setForgotError("Please enter a valid email"); return; }

    try {
      setForgotLoading(true); setForgotError(""); setForgotMessage("");
      const result = await AuthApi.forgotPassword(forgotEmail, forgotTcode);
      if (result.success) {
        setForgotMessage("If the email exists, a password reset link has been sent.");
        setForgotEmail(""); setForgotTcode("");
      } else {
        setForgotError(result.errors || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { setResetError("Please fill all required fields"); return; }
    if (newPassword.length < 6) { setResetError("Password must be at least 6 characters long"); return; }
    if (newPassword !== confirmPassword) { setResetError("Passwords do not match"); return; }

    try {
      setResetLoading(true); setResetError(""); setResetMessage("");
      const result = await AuthApi.resetPassword(resetToken, newPassword);
      if (result.success) {
        setResetMessage("Password updated successfully. Redirecting to login...");
        setNewPassword(""); setConfirmPassword("");
        setTimeout(() => { setShowResetModal(false); window.location.href = "/login"; }, 3000);
      } else {
        setResetError(result.errors || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password || !credentials.tcode) {
      setShow(true); setErrorMessage("Please fill all required fields"); return;
    }
    if (!emailRegex.test(credentials.email)) {
      setShow(true); setErrorMessage("Please enter a valid email"); return;
    }

    try {
      setLoading(true); setShow(false);
      const result = await AuthApi.login(credentials);
      if (result.success) {
        // TOKEN STORE
        sessionStorage.setItem("token", result.authToken);
        sessionStorage.setItem("Refresh Token", result.refreshToken);

        sessionStorage.setItem("permissions", JSON.stringify(result.permissions || []));

        // 🔥 OPTIONAL: AuthHelper bhi call karo agar use karte ho
        // AuthHelper.setAuth(result.authToken, result.refreshToken, result.permissions);

        window.location.assign("/");
      } else {
        setShow(true); setErrorMessage(result.errors || "Invalid credentials  Please check your credentials and try again");
      }
    } catch (err) {
      setShow(true); setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!credentials.email || !credentials.password || !credentials.tcode) {
  //     setShow(true); setErrorMessage("Please fill all required fields"); return;
  //   }
  //   if (!emailRegex.test(credentials.email)) {
  //     setShow(true); setErrorMessage("Please enter a valid email"); return;
  //   }

  //   try {
  //     setLoading(true); setShow(false);
  //     const result = await AuthApi.login(credentials);
  //     if (result.success) {
  //       sessionStorage.setItem("token", result.authToken);
  //       sessionStorage.setItem("r-t", result.refreshToken);
  //       window.location.assign("/");
  //     } else {
  //       setShow(true); setErrorMessage(result.errors || "Invalid credentials  Please check your credentials and try again");
  //     }
  //   } catch (err) {
  //     setShow(true); setErrorMessage("Something went wrong. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const isFormValid =
    Boolean(credentials.password?.trim()) &&
    Boolean(credentials.tcode?.trim()) &&
    Boolean(credentials.email?.trim()) &&
    emailRegex.test(credentials.email);

  const ModalHeaderStyled = ({ title }) => (
    <div className="text-center" style={{ margin: "-30px" }}>

    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container style={{ padding: '30px' }}>
        <Row className="justify-content-center">
          <Col lg={9} xl={8}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              <Row className="g-0">
                <Col lg={6} className="d-none d-lg-flex align-items-center justify-content-center" style={{
                  backgroundColor: "var(--primary-background-color)",
                  minHeight: "100vh",
                }}>
                  <img src="Untitled design (7).png" width="600" height="600" alt="Logo" />
                </Col>

                <Col lg={6} className="p-5">
                  <div className="text-center mb-4">
                    <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--primary-color)", alignItems: "center", justifyCenter: "center", color: "#fff", margin: "0 auto 12px", fontSize: "26px", justifyContent: 'center' }}>
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <h3 className="fw-bold">Sign In</h3>
                    <h4 className="fw-bold" style={{ color: "var(--primary-color)", marginTop: "0px" }}>Library Management System</h4>
                  </div>

                  <Alert variant="danger" show={show}>{errorMessage}</Alert>

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="">Company Name</Form.Label>
                      <Form.Control type="text" name="tcode" placeholder="Enter company name" value={credentials.tcode} onChange={handleChange} style={{ padding: '5px' }} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="">Email</Form.Label>
                      <Form.Control type="email" name="email" placeholder="Enter email" value={credentials.email} onChange={handleChange} style={{ padding: '5px' }} />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="">Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control type={showPassword ? "text" : "password"} name="password" placeholder="Enter password" value={credentials.password} onChange={handleChange} style={{ padding: '5px' }} />
                        <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                          <i className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"}`} style={{ color: 'gray' }}></i>
                        </span>
                      </div>
                    </Form.Group>

                    <Button variant="" type="submit" disabled={!isFormValid || loading} className="w-100 border-0 login-btn" style={{ backgroundColor: "var(--primary-color)", color: "#fff", borderColor: "var(--primary-color)", padding: "12px", fontWeight: "600", borderRadius: "8px" }}>
                      {/* {loading ?<> <span className="loader-login"></span> Please Wait...</> : "Sign In"} */}
                      {loading ? (
                        <>
                          <span className="loader-login"></span>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>


                    <div className="mt-3 text-end">
                      <Button
                        variant="link"
                        onClick={() => setShowForgotModal(true)}
                        style={{
                          color: "#006dcc",
                          textDecoration: "none",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </div>

                  </Form>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
        contentClassName="border-0 shadow-lg"
        size="md"
        backdrop="static"
      >
        <Modal.Header closeButton style={{ background: "var(--secondary-color)", padding: '8px' }}>
          <b style={{ color: colors.navy, fontSize: '1.5rem' }}>Forgot Password</b>
        </Modal.Header>
        <Modal.Title>
          <ModalHeaderStyled />
        </Modal.Title>
        <Modal.Body className="px-4 pb-5">
          {/* <b className="text-success" show={!!forgotMessage}>{forgotMessage}</b> */}
          <Form onSubmit={handleForgotPassword}>
            <Form.Group className="mb-3 ">
              <Form.Label className="fw-medium">Company Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter company name"
                value={forgotTcode}
                onChange={(e) => setForgotTcode(e.target.value)}
                required
                style={{ padding: '5px' }}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                style={{ padding: '5px' }}
              />
              <span className="text-danger">{forgotError}</span>
            </Form.Group>
            <Button
              type="submit"
              variant=""
              disabled={forgotLoading}
              className="w-100 border-0"
              style={{ background: "var(--primary-color)", color: "#fff", borderRadius: "30px" }}
            >
              {forgotLoading ? <> <span className="loader-login"></span> Sending...</> : "Send Reset Link"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        centered
        contentClassName="border-0 shadow-lg"
        size="md"
        backdrop="static"
      >
        <Modal.Header closeButton style={{ background: "var(--secondary-color)", padding: '8px' }}>
          <b style={{ color: colors.navy, fontSize: '1.5rem' }}>Reset Password</b>
        </Modal.Header>
        <Modal.Title>
          <ModalHeaderStyled />
        </Modal.Title>
        <Modal.Body className="px-4 pb-5">
          {/* <b  className="text-danger" show={!!resetError}>{resetError}</b> */}
          <b className="text-success" show={!!resetMessage}>{resetMessage}</b>
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ padding: '5px' }}
                />
                <span onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                  <i className={`fa ${showNewPassword ? "fa-eye" : "fa-eye-slash"}`} style={{ color: 'gray' }}></i>
                </span>
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Confirm Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ padding: '5px' }}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                  <i className={`fa ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`}  style={{ color: 'gray' }}></i>
                </span>
              </div>
              <span className="text-danger">{resetError}</span>
            </Form.Group>
            <Button
              variant=""
              type="submit"
              disabled={resetLoading}
              className="w-100 border-0"
              style={{ background: "var(--primary-color)", color: "#fff", borderRadius: '30px' }}
            >
              {resetLoading ? <> <span className="loader-login"></span> Resetting...</> : "Reset Password"}

            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Login;