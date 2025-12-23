 
 
 
 
 
 
 
 
 
 


 

 


 
 
 
 
 
 
 
 



 
 
 
 
 
 

 
 
 

 


 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 


 
 
 
 
 
 
 
 
 

 
 

 
 
 
 

 

 
 

 
 
 

 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 



 
 
 
 
 
 
 
 
 
 
 
 
 

 
 

 
 
 
 

 
 
 
 
 
 

 
 
 
 
 
 

 
 

 
 
 

 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 

 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 

 
 
 

 

 
 
 
 
 

 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

 
 
 
 
 
 
 
 
 
 
 

 
 
 
 

 
 
 
 

 



import React, { useState, useRef, useEffect } from "react";
import {
  Button, Col, Container, Row, Card, Form,
  Image, Modal, InputGroup
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NameInitialsAvatar } from "react-name-initials-avatar";
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
import { COUNTRY_CODES } from "../constants/COUNTRY_CODES";

const EditProfile = () => {

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    country_code: "",
    phone: "",
    profile_image: ""
  });

 
  const [body, setBody] = useState("");
  const [imageError, setImageError] = useState(false);



  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const [fieldsValid, setFieldsValid] = useState({
    firstname: true,
    lastname: true,
    email: true,
    country_code: true,
    phone: true,

  });

 
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const decoded = jwt_decode(token);
        setUserId(decoded.id);

        const userApi = new DataApi("user");
        const res = await userApi.fetchById(decoded.id);

        setProfile(res.data);


        console.log("userApi", userApi)
        console.log("profile", profile)

 
        if (res.data?.profile_image) {
          console.log("hello", body)
          const imageUrl = `http://localhost:3003${res.data.profile_image}`;
          setBody(imageUrl);
          console.log("Image URL:", imageUrl);
          console.log("body", body)
        }

      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    console.log("body check", body)
  }, [])
 
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log("profile", profile)

    setProfile(prev => ({ ...prev, [name]: value }));
    setFieldsValid(prev => ({ ...prev, [name]: value.trim() !== "" }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    console.log("file is", file)
    if (!file) return;
    setImageError(false);
    setBody(URL.createObjectURL(file));

    setProfile(prev => ({
      ...prev,
      photo: file
    }));


  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userApi = new DataApi("user");
      console.log("profileeeeeeee", profile.photo);
      console.log("userIduserId", userId);

      const formData = new FormData();


      formData.append("firstname", profile.firstname);
      formData.append("lastname", profile.lastname);
      formData.append("email", profile.email);
      formData.append("phone", profile.phone);
      formData.append("country", profile.country);
      formData.append("currency", profile.currency);
      formData.append("time_zone", profile.time_zone);
      formData.append("companyid", profile.companyid);


      if (profile.photo) {
        formData.append("file", profile.photo);
      }

 
      if (profile.photo) {
        await userApi.updateFormData(formData, userId);
        await userApi.update(profile, userId);
        console.log("profiledsfsfsdfsdfsdfsd", profile);
        toast.success("Profile updated successfully");
      } else {
        await userApi.update(profile, userId);
        toast.success("Profile updated successfully");
      }
    } catch {
      toast.error("Update failed");
    }
  };


  const isFormValid = Object.values(fieldsValid).every(Boolean);

  if (isLoading) return <div>Loading...</div>;


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
          {/* ===== LEFT : IMAGE ===== */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">

                <div className="position-relative d-inline-block">
                  {imageError || !body ? (
                    <NameInitialsAvatar
                      size="150px"
                      textSize="36px"
                      name={`${profile.firstname} ${profile.lastname}`}
                    />
                  ) : (
                    <Image
                      src={body}
                      roundedCircle
                      style={{ width: 150, height: 150, objectFit: "cover" }}
                      onError={() => setImageError(true)}
                    />
                  )}

                  <div
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 border border-white"
                    style={{ cursor: "pointer" }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <i className="fa-solid fa-camera text-white"></i>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}

                  onChange={handlePhotoUpload}
                />

                <h4 className="mt-3">{profile.firstname} {profile.lastname}</h4>
                <p className="text-muted">{profile.email}</p>

              </Card.Body>
            </Card>
          </Col>

          {/* ===== RIGHT : FORM ===== */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        name="firstname"
                        value={profile.firstname}
                        onChange={handleChange}
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        name="lastname"
                        value={profile.lastname}
                        onChange={handleChange}
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        required
                      />
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label>Country Code</Form.Label>
                      <Form.Select
                        name="country_code"
                        value={profile.country_code}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {COUNTRY_CODES.map((c, i) => (
                          <option key={i} value={c.country_code}>
                            {c.country_code}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        maxLength={10}
                        required
                      />
                    </Col>

                    <Col xs={12} className="text-end mt-3">
                      <Button type="submit" disabled={!isFormValid}>
                        Save Changes
                      </Button>
                    </Col>
                  </Row>
                </Form>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default EditProfile;