import React, { useState, useRef, useEffect } from "react";
import { Button, Col, Container, Row, Badge, Card, Form, Image, Modal, InputGroup } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NameInitialsAvatar } from "react-name-initials-avatar";
import jwt_decode from "jwt-decode";
import DataApi from "../api/dataApi";
import axios from "axios";
import { API_BASE_URL } from "../constants/CONSTANT";
import { COUNTRY_CODES } from "../constants/COUNTRY_CODES";


const EditProfile = () => {

  const fileInputRef = useRef();


  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    email: '',
    country_code: '',
    phone: ''
  });
  const [body, setBody] = useState();



  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [brokenImages, setBrokenImages] = useState([]);

  const [showLibraryCardModal, setShowLibraryCardModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [userId, setUserId] = useState(null); // Store the user ID


  //formdata
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    firstname: '',
    lastname: '',
    country_code: ''
    // Add other fields as needed
  });

  const [fieldsValid, setFieldsValid] = useState({
    firstname: true,
    lastname: true,
    email: true,
    country_code: true,
    phone: true
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);


  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const decoded = jwt_decode(token);
        const userIdFromToken = decoded.id;

        if (!userIdFromToken) {
          console.error("User ID not found in token");
          return;
        }

        setUserId(userIdFromToken); // Store the userId

        const userApi = new DataApi("user");
        const userResponse = await userApi.fetchById(userIdFromToken);

        console.log("fetchuserApi", userApi)
        console.log("fetchres", userResponse)
        setProfile(userResponse.data);
        
        // Set profile image
        if (userResponse.data.image) {
          const imagePath = userResponse.data.image.startsWith('http') 
            ? userResponse.data.image 
            : `${API_BASE_URL}${userResponse.data.image}`;
          setBody(imagePath);
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value
    }));
    // Update fieldsValid state
    setFieldsValid((prevValid) => ({
      ...prevValid,
      [name]: value.trim() !== ""  // Set true if value is not empty
    }));
    console.log("fieldvalid", fieldsValid)
  };

  // Check if all fields are valid
  const isFormValid = Object.values(fieldsValid).every((valid) => valid);

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and GIF images are allowed.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum size is 5MB.");
      return;
    }

    try {
      setImageUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      const token = sessionStorage.getItem("token");
      
      // Upload image
      const response = await axios.post(
        `${API_BASE_URL}/api/user/${userId}/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token.startsWith("Bearer ") ? token : `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update profile with new image path
        const newImagePath = response.data.filePath;
        setProfile(prev => ({ ...prev, image: newImagePath }));
        setBody(`${API_BASE_URL}${newImagePath}`);
        
        // Also update the user record with the new image path
        const userApi = new DataApi("user");
        await userApi.update({ image: newImagePath }, userId);
        
        toast.success("Profile image updated successfully!");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.response?.data?.errors || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {

      const userApi = new DataApi("user");
      console.log("userapi", userApi)
      console.log("prifileid", profile.name)
      console.log("userid---->", userId)
      const response = await userApi.update(profile, userId);

      console.log("response", response)
      toast.success("Profile updated successfully!")
      // setSuccess("Profile updated successfully!");
    } catch (error) {
      toast.success("Failed to update profile.")
      // setError("Failed to update profile.");
    } finally {
      setIsLoading(false); // Stop loading animation
    }
  };

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
          {/* Left Column - Profile Picture & Library Card */}
          <Col lg={4} md={12} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                {/* Profile Picture */}
                <div className="text-center mb-4">
                  <div className="position-relative d-inline-block">
                    {brokenImages.includes(`img-${profile.id}`) ? (
                      <NameInitialsAvatar
                        size="150px"
                        textSize="36px"
                        bgColor="#667eea"
                        borderWidth="4px"
                        borderColor="#764ba2"
                        textColor="#fff"
                        name={`${profile.firstname} ${profile.lastname}`}
                      />
                    ) : (
                      <Image
                        src={body}
                        roundedCircle
                        className="border border-4"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                          borderColor: "#667eea !important",
                        }}
                        onError={() => setBrokenImages([...brokenImages, `img-${profile.id}`])}
                      />
                    )}
                    <div
                      className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 border border-3 border-white"
                      style={{ cursor: imageUploading ? "wait" : "pointer" }}
                      onClick={() => !imageUploading && fileInputRef.current.click()}
                    >
                      {imageUploading ? (
                        <span className="spinner-border spinner-border-sm text-white" role="status"></span>
                      ) : (
                        <i className="fa-solid fa-camera text-white"></i>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                  <h4 className="mt-3 mb-1 fw-bold">
                    {profile.firstname} {profile.lastname}
                  </h4>
                  <p className="text-muted mb-0">{profile.email}</p>
                </div>

                {/* Library Card Section */}
                {/* <div className="mt-4 pt-4 border-top">
                  <h5 className="fw-bold mb-3">
                    <i className="fa-solid fa-id-card me-2 text-primary"></i>
                    Library Cardddd
                  </h5>
                  {libraryCard ? (
                    <div className="border rounded p-3 bg-light">
                      <Row className="mb-2">
                        <Col xs={6}><strong>Card No:</strong></Col>
                        <Col xs={6} className="text-end">
                          <Badge bg="primary">{libraryCard.card_number}</Badge>
                        </Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={6}><strong>Status:</strong></Col>
                        <Col xs={6} className="text-end">
                          <Badge bg={libraryCard.status === "active" ? "success" : "secondary"}>
                            {libraryCard.status}
                          </Badge>
                        </Col>
                      </Row>
                      <Button
                        variant="outline-primary"
                        className="w-100 mt-2"
                        onClick={() => setShowLibraryCardModal(true)}
                      >
                        <i className="fa-solid fa-print me-2"></i>
                        View & Print Card
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded bg-light">
                      <i className="fa-solid fa-id-card fs-1 text-muted mb-3"></i>
                      <p className="text-muted mb-0">No library card assigned</p>
                    </div>
                  )}
                </div> */}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Edit Form */}
          <Col lg={8} md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold mb-0">
                    <i className="fa-solid fa-user-edit me-2 text-primary"></i>
                    Edit Profile
                  </h4>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="fa-solid fa-key me-2"></i>
                    Change Password
                  </Button>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">First Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="firstname"
                        value={profile.firstname}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Last Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="lastname"
                        value={profile.lastname}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                      />
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Label className="fw-semibold">Email <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        required
                      />
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label className="fw-semibold">Country Code</Form.Label>
                      <Form.Select
                        name="country_code"
                        value={profile.country_code}
                        onChange={handleChange}
                      >
                        <option value="">Select Code</option>
                        {COUNTRY_CODES.map((country, index) => (
                          <option key={index} value={country.country_code}>
                            {country.country_code} ({country.country})
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={3} className="mb-3">
                      <Form.Label className="fw-semibold">WhatsApp Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="10 digit number"
                        maxLength={10}
                        required
                      />
                    </Col>

                    <Col xs={12} className="mt-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" type="button" onClick={() => window.history.back()}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={!isFormValid}
                        >
                          <i className="fa-solid fa-save me-2"></i> Save Changes
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fa-solid fa-key me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form >
            <Form.Group className="mb-3">
              <Form.Label>New Password <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                  maxLength={16}
                  required
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">8-16 characters</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  isInvalid={confirmPassword && password !== confirmPassword}
                />
                <Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </Button>
              </InputGroup>
              {confirmPassword && password !== confirmPassword && (
                <Form.Control.Feedback type="invalid">
                  Passwords do not match
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={!password || !confirmPassword || password !== confirmPassword}>
                Update Password
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Library Card Modal (keep as is) */}
      <Modal show={showLibraryCardModal} onHide={() => setShowLibraryCardModal(false)} size="lg" centered>
        {/* ... existing library card modal content ... */}
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default EditProfile;