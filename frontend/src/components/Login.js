import React, { useState } from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import AuthApi from "../api/authApi";

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    tcode: "",
  });
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (credentials.email && credentials.password && credentials.tcode) {
        const result = await AuthApi.login(credentials);
        if (result.success) {
          sessionStorage.setItem("token", result.authToken);
          sessionStorage.setItem("r-t", result.refreshToken);
          sessionStorage.setItem("myimage", "/abdul-pathan.png");
          if (window.location.pathname.startsWith("/sandbox")) {
            window.location.assign("/sandbox/");
          } else {
            window.location.assign("/");
          }

        } else {
          setShow(true);
          setErrorMessage(result.errors);
        }
      }
    } catch (err) {
      setShow(true);
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const isFormValid =
    Boolean(credentials.password?.trim()) &&
    Boolean(credentials.tcode?.trim()) &&
    Boolean(credentials.email?.trim()) &&
    emailRegex.test(credentials.email);

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

                <Col
                  lg={6}
                  className="d-none d-lg-flex align-items-center justify-content-center"
                  style={{
                    backgroundColor: "var(--primary-background-color)",
                    minHeight: "100vh",
                  }}
                >
                  <div >
                    <img
                      src="Untitled design (7).png"
                      width="600"
                      height="600"

                    />

                  </div>
                </Col>

                {/* Right Section */}
                <Col lg={6} className="p-5">
                  <div className="text-center mb-4">
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        background: "var(--primary-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        margin: "0 auto 12px",
                        fontSize: "26px",
                      }}
                    >
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <h3 className="fw-bold">Signadsfjaksjdhaklsdfhsakld In sandbox</h3>
                    <h4
                      className="fw-bold"
                      style={{
                        color: "var(--primary-color)",
                        marginTop: "0px",
                      }}
                    >
                      Library Management System
                    </h4>

                  </div>

                  <Alert variant="danger" show={show}>
                    {errorMessage}
                  </Alert>

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="tcode"
                        placeholder="Enter company name"
                        value={credentials.tcode}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={credentials.email}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter password"
                          value={credentials.password}
                          onChange={handleChange}
                        />
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute",
                            right: "14px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                          }}
                        >
                          <i
                            className={`fa ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                          ></i>
                        </span>
                      </div>
                    </Form.Group>

                    <Button
                      type="submit"
                      disabled={!isFormValid}
                      variant="dark"
                      className="w-100"
                      style={{
                        backgroundColor: "var(--primary-color)",
                        borderColor: "var(--primary-color)",
                        padding: "12px",
                        fontWeight: "600",
                        borderRadius: "8px",
                      }}
                    >
                      Sign In
                    </Button>

                  </Form>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
