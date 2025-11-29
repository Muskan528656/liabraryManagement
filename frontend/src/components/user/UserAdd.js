import React, { useState, useEffect } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "react-bootstrap-typeahead/css/Typeahead.css";
 
import Select from "react-select";
import jwt_decode from "jwt-decode";
import { ToastContainer, toast } from "react-toastify"; // npm i react-toastify --force
import "react-toastify/dist/ReactToastify.css";
import CountryCode from "../../constants/CountryCode.json";

const UserAdd = () => {
  const location = useLocation();
  const navigate = useNavigate();
 
  const [user, setUser] = useState(location.state ? location.state : {});
  let name = user.firstname;
  const [optionUsers, setOptionUsers] = useState([]);
  const [option, setoption] = useState();
 
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const phoneRegex = /^[0-9]{10}$/;
  const [showPassword, setShowPassword] = useState(false);
  const [loginUserRole, setLoginUserRole] = useState("");
  const [whatsappSetting, setWhatsappSetting] = useState([]);
  const [userPlan, setUserPlan] = useState(null); // Plan information from token

  useEffect(() => {
 

 
    let userInfo = jwt_decode(sessionStorage.getItem("token"));
    setLoginUserRole(userInfo.userrole);
 
    if (userInfo.plan) {
      setUserPlan(userInfo.plan);
    }

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
      isWhatsAppSettingsValid
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      if (result.success) {
 
 
 
 
        const userId = finalUser.id ? finalUser.id : result.id;
        navigate(`/users`);
      } else {
        if (typeof result.errors === "string") {
          toast.error(`${result.errors}`);
        } else if (Array.isArray(result.errors)) {
          const errorMessage = result.errors
            .map((error) => error.msg)
            .join(", ");
          toast.error(`${errorMessage}`);
        } else {
          toast.error("An unexpected error occurred while saving the record.");
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
    }

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 

 

    if (name === "email") {
      setEmailError(!emailRegex.test(value) ? "Invalid email format." : "");
    }
  };

  const handleActive = (e) => {
    setUser({ ...user, isactive: e.target.checked });
  };

  const handleUsers = (event) => {
    setoption(event);
 
    setUser({ ...user, managerid: event.value, managername: event.label });
  };

  const handleTextOnlyChange = (e) => {
    const { name } = e.target;
    const value = e.target.value.replace(/[^A-Za-z ]/g, "");

    setUser({ ...user, [name]: value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSettingChange = (e) => {
    const selectedId = e.target.value;
  };
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

                <Row className="mb-3">
                  {/*<Col lg={6} sm={12} xs={12}>
                                        <Form.Group className="ms-3">
                                            <Form.Label htmlFor="phone">Phone</Form.Label>
                                            <Form.Control
                                                style={{ height: "36px" }}
                                                required
                                                type="text"
                                                name="phone"
                                                placeholder="Enter phone"
                                                value={user.phone}
                                                onChange={handleChange}
                                            />
                                            {phoneError && (
                                                <small className="text-danger"> {phoneError}</small>
                                            )}
                                        </Form.Group>
                                    </Col>*/}
                  <Col lg={2} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="country_code">
                        Country Code
                      </Form.Label>
                      <Form.Select
                        name="country_code"
                        value={user.country_code || "+91"}
                        onChange={(e) => handleChange(e)}
                        style={{ height: "36px" }}
                      >
                        {CountryCode.map((country, index) => (
                          <option key={index} value={country.country_code}>
                            {country.country} ({country.country_code})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={4} sm={12} xs={12}>
                    <Form.Group className="">
                      <Form.Label htmlFor="phone">Whatsapp Number</Form.Label>
                      <Form.Control
                        required
                        style={{ height: "36px" }}
                        type="text"
                        name="whatsapp_number"
                        placeholder="Enter Whatsapp Number"
                        value={user.whatsapp_number}
                        onChange={handleChange}
                      />
                      {whatsappError ? (
                        <small className="text-danger"> {whatsappError}</small>
                      ) : (
                        ""
                      )}
                    </Form.Group>
                  </Col>
                  <Col lg={6} sm={12} xs={12}>
                    <Form.Group className="ms-3">
                      <Form.Label htmlFor="email">Email</Form.Label>
                      <Form.Control
                        style={{ height: "36px" }}
                        type="email"
                        required
                        name="email"
                        placeholder="Enter email"
                        value={user.email}
                        onChange={handleChange}
                      />
                      {emailError && (
                        <small className="text-danger">{emailError}</small>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                {!user.id ? (
                  <>
                    <Row className="mb-3">
                      <Col lg={6} sm={12} xs={12}>
                        <Form.Group className="ms-3">
                          <Form.Label htmlFor="userrole">Role</Form.Label>
                          <Form.Select
                            style={{ height: "36px" }}
                            name="userrole"
                            value={user.userrole}
                            onChange={handleChange}
                            required
                          >

                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col lg={6} sm={12} xs={12}>
                        <Form.Group className="ms-3">
                          <Form.Label htmlFor="password">Password</Form.Label>
                          <div className="d-flex align-items-center position-relative">
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="password"
                              placeholder="Enter Password"
                              value={user.password}
                              onChange={handleChange}
                              required
                              style={{ height: "36px" }}
                            />
                            <span
                              className="position-absolute end-0 me-3"
                              onClick={togglePasswordVisibility}
                            >
                              <i
                                className={
                                  !showPassword ? "fa fa-eye-slash" : "fa fa-eye"
                                }
                                aria-hidden="true"
                                style={{ cursor: "pointer" }}
                              ></i>
                            </span>
                          </div>

                          {passwordError && (
                            <small className="text-danger">
                              {" "}
                              {passwordError}
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
                          {userPlan && userPlan.number_of_whatsapp_setting !== undefined && (
                            <span className="text-muted" style={{ fontSize: "12px", marginLeft: "8px" }}>
                              (Plan Limit: {userPlan.number_of_whatsapp_setting})
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

 
                            if (userPlan && userPlan.number_of_whatsapp_setting) {
                              const limit = userPlan.number_of_whatsapp_setting;
                              if (selectedPhones.length > limit) {
                                toast.warning(`Plan allows maximum ${limit} WhatsApp setting(s). Only first ${limit} will be selected.`);
                                const limitedPhones = selectedPhones.slice(0, limit);
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
                            userPlan && userPlan.number_of_whatsapp_setting === 0
                          }
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Row>
                  <Col lg={12} sm={12} xs={12}>
                    <hr></hr>
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
