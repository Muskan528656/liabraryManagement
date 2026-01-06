import React, { useState, useEffect } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { useLocation, useNavigate } from "react-router-dom";
import "react-bootstrap-typeahead/css/Typeahead.css";
import Select from "react-select";
import jwt_decode from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CountryCode from "../../constants/CountryCode.json";
import DataApi from "../../api/dataApi";


const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    style={{ color: "#6c757d" }}
  >
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
    style={{ color: "#6c757d" }}
  >
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
  </svg>
);

const UserAdd = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(location.state ? location.state : {});

  let name = user.firstname;
  const [option, setoption] = useState();
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState("");


  const phoneRegex = /^[0-9]{10}$/;
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginUserRole, setLoginUserRole] = useState("");

  const [whatsappSetting, setWhatsappSetting] = useState([]);
  const [userPlan, setUserPlan] = useState(null);
  const [companyCountryCode, setCompanyCountryCode] = useState("+91");

  useEffect(() => {
    let userInfo = jwt_decode(sessionStorage.getItem("token"));
    setLoginUserRole(userInfo.userrole);

    if (userInfo.plan) {
      setUserPlan(userInfo.plan);
    }

    fetchCompanyCountryCode();

    if (user.id) {
      let temp = {};
      temp.value = user.managerid;
      temp.label = user.managername;
      setoption(temp);
    } else {
      let temp = {};
      temp.value = userInfo.id;
      temp.label = userInfo.username;
      setoption(temp);
      setUser({
        ...user,
        managerid: userInfo.id,
        userrole: "USER",
        managername: userInfo.username,
      });
    }

  }, [user.id]);

  const fetchCompanyCountryCode = async () => {
    try {
      const response = await DataApi.fetchAll("/company");
      if (response && response.country_code) {
        setCompanyCountryCode(response.country_code);

        if (!user.country_code) {
          setUser((prevUser) => ({
            ...prevUser,
            country_code: response.country_code,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching company country code:", error);
      setCompanyCountryCode("+91");
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isFormValid = () => {
    const isWhatsAppSettingsValid =
      user.userrole === "USER"
        ? Array.isArray(user.whatsapp_settings) &&
        user.whatsapp_settings.length > 0
        : true;

    return (
      Boolean(user.firstname?.trim()) &&
      Boolean(user.lastname?.trim()) &&
      Boolean(user.email?.trim()) &&
      Boolean(user.whatsapp_number?.trim()) &&
      Boolean(user.userrole?.trim()) &&
      Boolean(option?.value) &&
      !emailError &&
      passwordError === "" &&
      confirmPasswordError === "" &&
      isWhatsAppSettingsValid
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.password !== user.confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    const finalUser = {
      ...user,
      isactive: user.isactive !== undefined ? user.isactive : false,
      whatsapp_settings: user.whatsapp_settings || [],
    };

    try {
      if (!finalUser.managerid && option) {
        finalUser.managerid = option.value;
        finalUser.managername = option.label;
      }

      setIsSending(true);

      finalUser.country_code = finalUser.country_code
        ? String(finalUser.country_code).trim()
        : "+91";

      let result = {};

      if (finalUser.id) {

      } else {

      }


      if (result.success !== false) {
        navigate(`/users`);
      } else {
        if (typeof result.errors === "string") {
          toast.error(`${result.errors}`);
        } else {
          toast.error("An error occurred.");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the record.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    navigate(`/users/`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    if (name === "password") {
      if (value.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
      } else if (value.length > 16) {
        setPasswordError("Password cannot exceed 16 characters.");
      } else {
        setPasswordError("");
      }
      if (user.confirmPassword && value !== user.confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
      } else if (user.confirmPassword) {
        setConfirmPasswordError("");
      }
    }

    if (name === "confirmPassword") {
      if (value !== user.password) {
        setConfirmPasswordError("Passwords do not match.");
      } else {
        setConfirmPasswordError("");
      }
    }

    if (name === "email") {
      setEmailError(!emailRegex.test(value) ? "Invalid email format." : "");
    }
  };

  const handleActive = (e) => {
    setUser({ ...user, isactive: e.target.checked });
  };

  const handleTextOnlyChange = (e) => {
    const { name } = e.target;
    const value = e.target.value.replace(/[^A-Za-z ]/g, "");
    setUser({ ...user, [name]: value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <>
      <Container className="mt-5">
        <Row className="mx-5 text-center">
          <Col lg={12} xs={12} sm={12}>
            <div
              className=" text-center p-2"
              style={{
                height: "40px",
                backgroundColor: "#ffffff",
                borderRadius: "5px",
              }}
            >
              <span
                className="fw-semibold"
                style={{ color: "#605C68", fontSize: "large" }}
              >
                {user.id ? "Edit User" : "Add User"}
              </span>
            </div>
          </Col>
        </Row>
      </Container>

      <Container className="mt-1 mb-5">
        <Row className="mx-5">
          <Col lg={12} sm={12} xs={12} className="mb-2">
            <Card className="h-100" style={{ border: "none" }}>
              <Card.Body>
                {/* First / Last name */}
                <Row className="mb-3">
                  <Col lg={6} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="firstname">First Name</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="firstname"
                        placeholder="Enter first name"
                        value={user.firstname}
                        onChange={handleTextOnlyChange}
                        style={{ height: "36px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={6} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="lastname">Last Name</Form.Label>
                      <Form.Control
                        required
                        type="text"
                        name="lastname"
                        placeholder="Enter lastname"
                        value={user.lastname}
                        onChange={handleTextOnlyChange}
                        style={{ height: "36px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* PHONE, WhatsApp, Email */}
                <Row className="mb-3">
                  <Col lg={4} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="phone_number">
                        Phone Number
                      </Form.Label>
                      <InputGroup>
                        <Form.Select
                          name="country_code"
                          value={user.country_code || companyCountryCode}
                          onChange={handleChange}
                          style={{
                            height: "38px",
                            maxWidth: "150px",
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        >
                          {CountryCode.map((country, index) => (
                            <option key={index} value={country.country_code}>
                              {country.country} ({country.country_code})
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control
                          style={{ height: "38px" }}
                          type="text"
                          name="phone_number"
                          required="true"
                          placeholder="Phone Number"
                          value={user.phone_number || ""}
                          onChange={handleChange}
                        />
                        
                      </InputGroup>
                    </Form.Group>
                  </Col>

                  <Col lg={4} sm={12} xs={12}>
                    <Form.Group className="">
                      <Form.Label htmlFor="whatsapp_number">
                        Whatsapp Number
                      </Form.Label>
                      <Form.Control
                        required
                        style={{ height: "38px" }}
                        type="text"
                        name="whatsapp_number"
                        placeholder="Enter Whatsapp Number"
                        value={user.whatsapp_number || ""}
                        onChange={handleChange}
                      />
                      {whatsappError && (
                        <small className="text-danger">{whatsappError}</small>
                      )}
                    </Form.Group>
                  </Col>

                  <Col lg={4} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="email">Email</Form.Label>
                      <Form.Control
                        style={{ height: "38px" }}
                        type="email"
                        required
                        name="email"
                        placeholder="Enter email"
                        value={user.email || ""}
                        onChange={handleChange}
                      />
                      {emailError && (
                        <small className="text-danger">{emailError}</small>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                {/* Role + Password + Confirm Password */}
                {!user.id ? (
                  <>
                    <Row className="mb-3">
                      <Col lg={4} sm={12} xs={12}>
                        <Form.Group className="ms-3">
                          <Form.Label htmlFor="userrole">Role</Form.Label>
                          <Form.Select
                            style={{ height: "36px" }}
                            name="userrole"
                            value={user.userrole}
                            onChange={handleChange}
                            required
                          >
                            <option value="USER">USER</option>
                            {loginUserRole === "ADMIN" && (
                              <option value="ADMIN">ADMIN</option>
                            )}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col lg={4} sm={12} xs={12}>
                        <Form.Group className="ms-3">
                          <Form.Label htmlFor="password">Password</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="password"
                              placeholder="Enter Password"
                              value={user.password}
                              onChange={handleChange}
                              required
                              style={{
                                height: "36px",
                                borderRight: "none", 
                              }}
                            />
                            <InputGroup.Text
                              onClick={togglePasswordVisibility}
                              style={{
                                backgroundColor: "white",
                                borderLeft: "none",
                                cursor: "pointer",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </InputGroup.Text>
                          </InputGroup>

                          {passwordError && (
                            <small className="text-danger">
                              {passwordError}
                            </small>
                          )}
                        </Form.Group>
                      </Col>

                      <Col lg={4} sm={12} xs={12}>
                        <Form.Group className="ms-3">
                          <Form.Label htmlFor="confirmPassword">
                            Confirm Password
                          </Form.Label>
                          <InputGroup>
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="confirmPassword"
                              placeholder="Confirm Password"
                              value={user.confirmPassword || ""}
                              onChange={handleChange}
                              required
                              style={{
                                height: "36px",
                                borderRight: "none",
                              }}
                            />
                            <InputGroup.Text
                              onClick={togglePasswordVisibility}
                              style={{
                                backgroundColor: "white",
                                borderLeft: "none",
                                cursor: "pointer",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </InputGroup.Text>
                          </InputGroup>

                          {confirmPasswordError && (
                            <small className="text-danger">
                              {confirmPasswordError}
                            </small>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Row className="mb-3">
                    <Col lg={6} sm={12} xs={12}>
                      <Form.Group className="ms-3">
                        <Form.Label htmlFor="userrole">Role</Form.Label>
                        {loginUserRole === "ADMIN" ? (
                          <Form.Select
                            style={{ height: "36px" }}
                            name="userrole"
                            value={user.userrole || "STUDENT"}
                            onChange={handleChange}
                            required
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="STUDENT">STUDENT</option>
                          </Form.Select>
                        ) : (
                          <Form.Control
                            style={{ height: "36px" }}
                            type="text"
                            name="userrole"
                            placeholder="Enter Role"
                            value={user.userrole}
                            onChange={handleChange}
                            disabled
                          />
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Active */}
                <Row className="mb-3">
                  <Col lg={6} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="isactive">Active</Form.Label>
                      <Form.Check
                        name="isactive"
                        type="checkbox"
                        value="true"
                        checked={user.isactive === true}
                        id="inline-checkbox-9"
                        onChange={handleActive}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  {user.userrole !== "ADMIN" && (
                    <Col lg={6} sm={12} xs={12}>
                      <Form.Group className="ms-3 mb-2">
                        <Form.Label htmlFor="userrole">
                          Assign WhatsApp Setting
                          {userPlan &&
                            userPlan.number_of_whatsapp_setting !==
                            undefined && (
                              <span
                                className="text-muted"
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "8px",
                                }}
                              >
                                (Plan Limit:{" "}
                                {userPlan.number_of_whatsapp_setting})
                              </span>
                            )}
                        </Form.Label>
                        <Select
                          isMulti
                          className="custom-select username"
                          options={whatsappSetting.map((setting) => ({
                            value: setting.phone,
                            label: `${setting.name} (${setting.phone})`,
                          }))}
                          value={user.whatsapp_settings?.map((phone) => ({
                            value: phone,
                            label:
                              whatsappSetting.find(
                                (setting) => setting.phone === phone
                              )?.name || phone,
                          }))}
                          onChange={(selected) => {
                            const selectedPhones = selected.map(
                              (option) => option.value
                            );
                            if (
                              userPlan &&
                              userPlan.number_of_whatsapp_setting
                            ) {
                              const limit = userPlan.number_of_whatsapp_setting;
                              if (selectedPhones.length > limit) {
                                toast.warning(
                                  `Plan allows maximum ${limit} WhatsApp setting(s). Only first ${limit} will be selected.`
                                );
                                const limitedPhones = selectedPhones.slice(
                                  0,
                                  limit
                                );
                                setUser({
                                  ...user,
                                  whatsapp_settings: limitedPhones,
                                });
                                return;
                              }
                            }
                            setUser({
                              ...user,
                              whatsapp_settings: selectedPhones,
                            });
                          }}
                          isDisabled={
                            userPlan &&
                            userPlan.number_of_whatsapp_setting === 0
                          }
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Row>
                  <Col lg={12} sm={12} xs={12}>
                    <hr />
                  </Col>
                </Row>
                <Row className="g-0 mb-2">
                  <Col lg={12} sm={12} xs={12} className="text-end mt-1">
                    <Button
                      className="mx-2"
                      variant="light"
                      disabled={isSending}
                      onClick={handleCancel}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outline-secondary"
                      disabled={!isFormValid()}
                      onClick={handleSubmit}
                    >
                      {isSending ? "Saving..." : "Save"}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </>
  );
};

export default UserAdd;
