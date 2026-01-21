import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Container, Row, Card, Form, Image } from "react-bootstrap";
import { NameInitialsAvatar } from "react-name-initials-avatar";
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
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
    profile_image: "",
  });

  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

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

        console.log("Fetched user profile:", res.data.profile_image);

        setProfile(res.data);
        if (res.data.profile_image) {
          setImagePreview(res.data.profile_image);
          console.log("imagePreview set to:", res.data.profile_image);
        }
        // if (res.data.profile_image) {
        //   setImagePreview(`${API_BASE_URL}${res.data.profile_image}`); // ✓ FIX
        // }


        console.log("imagePreview usestate setting:", imagePreview);
      } catch (error) {
        PubSub.publish("RECORD_ERROR_TOAST", {
          title: "Error",
          message: "Failed to load profile",
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
    console.log("iamgePreview on handlechange:", imagePreview);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];


    console.log("file uploaded:", file);
    console.log("imagePreview photo before:", imagePreview);
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Only JPG, PNG, and GIF images are allowed",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Image size must be less than 5MB",
      });
      e.target.value = "";
      return;
    }

    setSelectedProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError(false);
  };

  /* ================= SAVE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting profile------>:", profile);
    console.log("imagePreview on submit:", imagePreview);

    try {
      setIsLoading(true);
      const userApi = new DataApi("user");

      console.log("selectedProfileImage before submit:", selectedProfileImage);

      if (selectedProfileImage) {
        const formData = new FormData();

        console.log("selectedProfileImage:", selectedProfileImage);
        console.log("userId:", userId);
        console.log("formData before append:", formData);
        formData.append("profile_image", selectedProfileImage);

        Object.keys(profile).forEach((key) => {
          if (key !== "profile_image" && profile[key] !== null) {
            formData.append(key, profile[key]);
          }
        });

        const response = await userApi.updateFormData(formData, userId);

        if (response.data?.success) {
          const updatedUser = response.data.data;
          setProfile(updatedUser);
          setSelectedProfileImage(null);

          // setImagePreview(
          //   updatedUser.profile_image
          //     ? `${API_BASE_URL}${updatedUser.profile_image}?t=${Date.now()}`
          //     : ""
          // );
          setImagePreview(
            updatedUser.profile_image
              ? `${updatedUser.profile_image}?t=${Date.now()}`
              : ""
          );


          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Profile updated successfully!",
          });

          PubSub.publish("USER_UPDATED", { user: updatedUser });
        }
      } else {
        const response = await userApi.update(profile, userId);


        console.log("Response from update:", response);

        if (response.data) {
          const updatedUser = response.data.data || response.data;
          setProfile(updatedUser);

          PubSub.publish("RECORD_SAVED_TOAST", {
            title: "Success",
            message: "Profile updated successfully!",
          });
        }
      }
    } catch (error) {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message:
          error.response?.data?.errors ||
          "Failed to update profile details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Container fluid className="py-4">
      <Row>

        <Col lg={4}>
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
                  <img
                    src={


                      imagePreview
                        ? imagePreview
                        : profile.profile_image
                          ? `${API_BASE_URL}${profile.profile_image}`
                          : ""
                    }
                    className="rounded-circle"
                    style={{ width: 150, height: 150, objectFit: "cover" }}
                    onError={() => setImageError(true)}
                  />
                )}

                <div
                  className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2"
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

        {/* ===== FORM ===== */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Form >
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
                    <Button className="btn-custom" type="submit" onClick={handleSubmit}>
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
  );
};

export default EditProfile;
