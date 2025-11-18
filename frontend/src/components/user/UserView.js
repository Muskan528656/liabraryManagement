import React, { useState, useEffect } from "react";
// import WhatsAppAPI from "../../api/WhatsAppAPI";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// import RelatedLocationHistory from "./RelatedLocationHistory";
import { ToastContainer, toast } from "react-toastify"; // npm i react-toastify --force
import "react-toastify/dist/ReactToastify.css";
import PubSub from "pubsub-js";
const UserView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(location.state ? location.state : {});
  // console.log("🚀 ~ UserView ~ user:", user);
  const [locationHistorysTab, setLocationHistorysTab] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [chatTab, setChatTab] = useState(false);

  useEffect(() => {
    fetchUserById();
  }, []);
  const handlePasswordOnchange = (e) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }

    setError("");
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

  const fetchUserById = () => {
    if (
      location.hasOwnProperty("pathname") &&
      location.pathname.split("/").length >= 3
    ) {
      user.id = location.pathname.split("/")[2];
    }

    async function inituser() {
      // let result = await WhatsAppAPI.fetchUserById(user.id);
      // let result = await WhatsAppAPI.fetchUserById(user.id, user.tenantcode);

      // setUser(result);
    }
    inituser();
  };

  const editUser = (row) => {
    navigate(`/users/${row.user.id}/e`, { state: row.user });
  };

  // const handleChangeSubmit = async (e) => {
  //   e.preventDefault();

  //   let newUser = { id: user.id, password: password };
  //   try {
  //     const result = await WhatsAppAPI.saveUser(newUser);
  //     setShowPasswordModal(false);
  //         PubSub.publish("RECORD_SAVED_TOAST", {
  //         title: "Success",
  //         message: "Record saved successfully",
  //       });
  //   } catch (error) {
  //     toast.error("Failed to update password.", error);
  //     //    console.log('API error:', error);
  //   }
  // };

  const handleClose = () => {
    setShowPasswordModal(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleBack = () => {
    navigate("/users");
  };
  // const handleSelect = (key) => {
  //   if (key === 'login history') {
  //     setLocationHistorysTab(true);

  //   }
  // }
  const handleSelect = (key) => {
    if (key === "login history") {
      setLocationHistorysTab(true);
      setChatTab(false);
    }
    if (key === "chat") {
      setLocationHistorysTab(false);
      setChatTab(true);
    }
  };

  const handleShowPasswordModal = () => {
    setShowPasswordModal(true);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  return (
    <>
      <Container className="mt-5">
        <Row className="mx-5 section-header">
          <Col lg={12} sm={12} xs={12}>
            <Row className="view-form-header align-items-center">
              <Col lg={8} sm={8} xs={8} className="">
                User
                <h5>
                  {user.firstname ? user.firstname : ""}&nbsp;
                  {user.lastname ? user.lastname : ""}
                </h5>
              </Col>
              <Col lg={4} sm={4} xs={4} className="text-end">
                <Button
                  className="mx-2 btn-sm"
                  variant="outline-light"
                  onClick={handleBack}
                >
                  Back
                </Button>

                <Button
                  className="mx-2 btn-sm"
                  variant="light"
                  onClick={() => editUser({ user })}
                >
                  Edit
                </Button>

                <Button
                  className="btn btn-sm"
                  variant="danger"
                  onClick={handleShowPasswordModal}
                >
                  Reset Password
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      <Container className="mt-1">
        <Row className="mx-5 view-form">
          <Col lg={12} sm={12} xs={12}>
            <Row className="py-2 ibs-edit-form">
              <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>First Name</label>
                <span className="text-capitalize">
                  {user.firstname ? user.firstname : <>&nbsp;</>}
                </span>
              </Col>
              <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>Last Name</label>
                <span className="text-capitalize">
                  {user.lastname ? user.lastname : <>&nbsp;</>}
                </span>
              </Col>
              <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>Email</label>
                <span>{user.email ? user.email : <>&nbsp;</>}</span>
              </Col>
              {/* <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>Phone</label>
                <span>{user.phone ? user.phone : <>&nbsp;</>}</span>
              </Col> */}
              <Col lg={2} sm={2} xs={2} className="mb-2">
                <label>Country Code</label>
                <span>
                  {user.country_code ? user.country_code : <>&nbsp;</>}
                </span>
              </Col>
              <Col lg={4} sm={4} xs={4} className="mb-2">
                <label>Whatsapp Number</label>
                <span>
                  {user.whatsapp_number ? user.whatsapp_number : <>&nbsp;</>}
                </span>
              </Col>
              <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>User Role</label>
                <span className="text-capitalize">
                  {user.userrole ? user.userrole : <>&nbsp;</>}
                </span>
              </Col>
              <Col lg={6} sm={6} xs={6} className="mb-2">
                <label>Manager</label>
                <span className="text-capitalize">
                  {user.managername ? user.managername : <>&nbsp;</>}
                </span>
              </Col>
              {user.userrole === "USER" && (
                <Col lg={6} sm={6} xs={6} className="mb-2">
                  <label>WhatsApp Setting</label>
                  <span className="text-capitalize">
                    {user.whatsapp_settings &&
                    user.whatsapp_settings.length > 0 ? (
                      user.whatsapp_settings.join(", ")
                    ) : (
                      <>&nbsp;</>
                    )}
                  </span>
                </Col>
              )}

              <Col lg={6} sm={6} xs={6} className="mb-4">
                <label>Active</label>
                <span>
                  {user.isactive === true && (
                    <i
                      className="fa-regular fa-square-check"
                      style={{ fontSize: "1.3rem" }}
                    ></i>
                  )}
                  {user.isactive === false && (
                    <i
                      className="fa-regular fa-square"
                      style={{ fontSize: "1.3rem" }}
                    ></i>
                  )}
                </span>
              </Col>
            </Row>
          </Col>
        </Row>
        {/* <Card bg="light" text="light" className="mx-5 mt-4">
          <Card.Header className="d-flex card-header-grey justify-content-between">
            <Tabs defaultActiveKey="login history" id="uncontrolled-tab-example" onSelect={(key) => handleSelect(key)}>
              <Tab eventKey="login history" title="Login History"></Tab>
            </Tabs>

          </Card.Header>
          <Card.Body>
            {user && user.id && locationHistorysTab && (<RelatedLocationHistory parent={user} />)}
          </Card.Body>
        </Card> */}
        <ToastContainer />
      </Container>

      <Container className="mt-5">
        <Modal
          show={showPasswordModal}
          aria-labelledby="contained-modal-title-vcenter"
          centered
          size="md"
        >
          <Modal.Header closeButton onClick={handleClose}>
            <Modal.Title id="contained-modal-title-vcenter">
              Change Password
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mx-2">
              <Col lg={12} sm={12} xs={12}>
                <Form noValidate className="mb-0">
                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>New Password</Form.Label>
                    <div className="d-flex align-items-center position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={handlePasswordOnchange}
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
                  </Form.Group>
                  <Form.Group
                    className="mb-3"
                    controlId="formBasicConfirmPassword"
                  >
                    <Form.Label>Confirm Password</Form.Label>
                    <div className="d-flex align-items-center position-relative">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmpassword"
                        placeholder="Enter your confirm password"
                        value={confirmPassword}
                        onChange={handlePasswordOnchange}
                        required
                        style={{ height: "36px" }}
                      />
                      <span
                        className="position-absolute end-0 me-3"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        <i
                          className={
                            !showConfirmPassword
                              ? "fa fa-eye-slash"
                              : "fa fa-eye"
                          }
                          aria-hidden="true"
                          style={{ cursor: "pointer" }}
                        ></i>
                      </span>
                    </div>
                  </Form.Group>
                  {error && <p className="text-danger">{error}</p>}
                </Form>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-end">
              <Button variant="outline-primary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="ms-2"
                variant="outline-secondary"
                disabled={isSubmitDisabled()}
                // onClick={handleChangeSubmit}
              >
                Save
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default UserView;
