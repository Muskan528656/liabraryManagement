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
  const [show, setShow] = React.useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (credentials.email && credentials.password && credentials.tcode) {
        const result = await AuthApi.login(credentials);

        if (result.success) {
          sessionStorage.setItem("token", result.authToken);
          sessionStorage.setItem("r-t", result.refreshToken);

          let data = "";
          if (data)
            sessionStorage.setItem("myimage", window.URL.createObjectURL(data));
          else sessionStorage.setItem("myimage", "/abdul-pathan.png");

 
 
 
 
 
 
 
 
 
 
 
 
 
 

          window.location.assign("/");
        } else {
          setShow(true);
          setErrorMessage(result.errors);
        }
      }
    } catch (error) {
 
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
        background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                overflow: "hidden",
                display: "flex",
                minHeight: "600px",
              }}
            >
              {/* Left Section - Illustration */}
              <Col
                lg={6}
                className="d-none d-lg-flex align-items-center justify-content-center p-5"
                style={{
                  background: "linear-gradient(135deg, #e9d5ff 0%, #f3e8ff 100%)",
                  position: "relative",
                }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <img
 
                      src="https://banner2.cleanpng.com/cb4/nis/mpu/abme50yvh.webp"
                      alt="Library Management"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        maxHeight: "300px",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                  <h2 className="fw-bold mb-3" style={{ color: "#6f42c1" }}>
                    Welcome to Library Management
                  </h2>
                  <p style={{ color: "#8b5cf6", fontSize: "16px" }}>
                    Your Library Dashboard
                  </p>

                </div>
              </Col>

              {/* Right Section - Login Form */}
              <Col lg={6} className="p-5 d-flex align-items-center">
                <div style={{ width: "100%" }}>
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-block mb-3"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "28px",
                      }}
                    >
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <h3 className="fw-bold mb-2" style={{ color: "#2d3748" }}>
                      Sign In
                    </h3>
                    <p className="text-muted">Enter your credentials to continue</p>
                  </div>

                  {/* Social Login Buttons */}
                  {/* <div className="d-flex gap-2 mb-4">
                    <Button
                      variant="outline-primary"
                      className="flex-fill"
                      style={{
                        borderColor: "#e2e8f0",
                        color: "#2d3748",
                        height: "45px",
                        borderRadius: "8px",
                      }}
                    >
                      <i className="fa-brands fa-google me-2"></i>
                      Sign in with Google
                    </Button>
                    <Button
                      variant="outline-primary"
                      className="flex-fill"
                      style={{
                        borderColor: "#e2e8f0",
                        color: "#2d3748",
                        height: "45px",
                        borderRadius: "8px",
                      }}
                    >
                      <i className="fa-brands fa-facebook me-2"></i>
                      Sign in with FB
                    </Button>
                  </div> */}

                  <div className="text-center mb-4 position-relative">
                    <hr />
                    <span
                      className="position-absolute"
                      style={{
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "white",
                        padding: "0 15px",
                        color: "#6c757d",
                        fontSize: "14px",
                      }}
                    >
                      or sign in with
                    </span>
                  </div>

                  <Alert variant="danger" show={show} className="error-alert mb-3">
                    {errorMessage}
                  </Alert>

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Company Name</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="tcode"
                        onChange={handleChange}
                        placeholder="Enter your company name"
                        value={credentials.tcode}
                        autoComplete="code"
                        style={{
                          height: "45px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicEmail">
                      <Form.Label className="fw-semibold">Username</Form.Label>
                      <Form.Control
                        required
                        type="email"
                        name="email"
                        onChange={handleChange}
                        placeholder="Enter your email"
                        value={credentials.email}
                        autoComplete="username"
                        style={{
                          height: "45px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                      <Form.Label className="fw-semibold">Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          required
                          type={showPassword ? "text" : "password"}
                          name="password"
                          onChange={handleChange}
                          placeholder="Enter your password"
                          value={credentials.password}
                          autoComplete="current-password"
                          style={{
                            height: "45px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            paddingRight: "45px",
                          }}
                        />
                        <span
                          className="position-absolute end-0 top-50 translate-middle-y me-3"
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer", color: "#6c757d" }}
                        >
                          <i
                            className={`fa ${!showPassword ? "fa-eye-slash" : "fa-eye"}`}
                          ></i>
                        </span>
                      </div>
                    </Form.Group>



                    <Button
                      className="w-100"
                      disabled={!isFormValid}
                      type="submit"
                      style={{
                        background: "linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)",
                        border: "none",
                        height: "45px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "16px",
                      }}
                    >
                      Sign In
                    </Button>
                  </Form>


                </div>
              </Col>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
