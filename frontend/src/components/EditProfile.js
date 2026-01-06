import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Container, Row, Card, Form, Image } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NameInitialsAvatar } from "react-name-initials-avatar";
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
import axios from "axios";
import { API_BASE_URL } from "../constants/CONSTANT";
import { COUNTRY_CODES } from "../constants/COUNTRY_CODES";
import PubSub from "pubsub-js";

const EditProfile = () => {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    email: "",
    country_code: "",
    phone: "",
  });

  const [imagePreview, setImagePreview] = useState("");
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

  /* ================= FETCH USER ================= */
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const decoded = jwt_decode(token);
        setUserId(decoded.id);

        const userApi = new DataApi("user");
        const res = await userApi.fetchById(decoded.id);

        setProfile(res.data);

        const storedImage = localStorage.getItem(`profile_image_${decoded.id}`);
        if (storedImage) {
          setImagePreview(storedImage);
        }
      } catch (error) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Load Error",
          message: "Failed to load profile"
        });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setFieldsValid((prev) => ({ ...prev, [name]: value.trim() !== "" }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageError(false);
    setImagePreview(URL.createObjectURL(file));
    setProfile((prev) => ({ ...prev, photo: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userApi = new DataApi("user");

      let imagePath = profile.profile_image;
      if (profile.photo) {
        const formData = new FormData();
        formData.append("file", profile.photo);

        const uploadResponse = await axios.post(
          `${API_BASE_URL}/api/user/${userId}/upload-image`,
          formData,
          {
            headers: {
              Authorization: sessionStorage.getItem("token").startsWith("Bearer ")
                ? sessionStorage.getItem("token")
                : `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (uploadResponse.data.success) {
          imagePath = uploadResponse.data.filePath;
          setImagePreview(imagePath);
          setProfile((prev) => ({ ...prev, profile_image: imagePath, photo: null }));
          localStorage.setItem(`profile_image_${userId}`, imagePath);
        }
      }

      const { photo, profile_image, ...profileData } = profile;
      await userApi.update(profileData, userId);
      toast.success("Profile updated successfully");
    } catch {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Update Error",
        message: "Update failed"
      });
    }
  };

  const isFormValid = Object.values(fieldsValid).every(Boolean);
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          {/* ===== LEFT : IMAGE ===== */}
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="position-relative d-inline-block">
                  {imageError || !imagePreview ? (
                    <NameInitialsAvatar
                      size="150px"
                      textSize="36px"
                      name={`${profile.firstname} ${profile.lastname}`}
                    />
                  ) : (
                    <Image
                      src={imagePreview}
                      roundedCircle
                      style={{ width: 150, height: 150, objectFit: "cover" }}
                      onError={() => setImageError(true)}
                    />
                  )}

                  {/* <div
                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <i className="fa-solid fa-camera text-white"></i>
                  </div> */}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoUpload}
                />

                <h4 className="mt-3">
                  {profile.firstname} {profile.lastname}
                </h4>
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
                      <Button className="btn-custom" type="submit" disabled={!isFormValid}>
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
