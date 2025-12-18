import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Table,
} from "react-bootstrap";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";

const Settings = () => {
  const [librarySettings, setLibrarySettings] = useState({
    max_books_per_card: 1,
    duration_days: 15,
    fine_per_day: 10,
    renew_limit: 2,
    max_issue_per_day: 1,
    lost_book_fine_percentage: 100,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorAuth, setTwoFactorAuth] = useState("text");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState({ ...librarySettings });

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlertMessage("New password and confirm password do not match!");
      setShowAlert(true);
      return;
    }

    if (newPassword.length < 6) {
      setAlertMessage("Password must be at least 6 characters long!");
      setShowAlert(true);
      return;
    }

    setAlertMessage(
      "Password changed successfully! You will be logged out of all devices."
    );
    setShowAlert(true);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleTwoFactorChange = (method) => {
    setTwoFactorAuth(method);
  };

 
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsApi = new DataApi("librarysettings");
      const response = await settingsApi.get("/all");
      if (response.data && response.data.success) {
        const settingsData = response.data.data;
 
        const settingsObj = {
          max_books_per_card: parseInt(settingsData.max_books_per_card || 1),
          duration_days: parseInt(settingsData.duration_days || 15),
          fine_per_day: parseInt(settingsData.fine_per_day || 10),
          renew_limit: parseInt(settingsData.renew_limit || 2),
          max_issue_per_day: parseInt(settingsData.max_issue_per_day || 1),
          lost_book_fine_percentage: parseInt(
            settingsData.lost_book_fine_percentage || 100
          ),
        };
        setLibrarySettings(settingsObj);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);

    }
  };

  const handleSettingsEdit = () => {
    setIsEditingSettings(true);
    setTempSettings({ ...librarySettings });
  };

  const handleSettingsSave = async () => {
    try {
      const settingsApi = new DataApi('librarysettings');

      const settingsArray = [
        {
          setting_key: "max_books_per_card",
          setting_value: tempSettings.max_books_per_card.toString(),
        },
        {
          setting_key: "duration_days",
          setting_value: tempSettings.duration_days.toString(),
        },
        {
          setting_key: "fine_per_day",
          setting_value: tempSettings.fine_per_day.toString(),
        },
        {
          setting_key: "renew_limit",
          setting_value: tempSettings.renew_limit.toString(),
        },
        {
          setting_key: "max_issue_per_day",
          setting_value: tempSettings.max_issue_per_day.toString(),
        },
        {
          setting_key: "lost_book_fine_percentage",
          setting_value: tempSettings.lost_book_fine_percentage.toString(),
        },
      ];

      const response = await settingsApi.put('/bulk', { settings: settingsArray });

      if (response.data && response.data.success) {
        setLibrarySettings({ ...tempSettings });
        setIsEditingSettings(false);
        setAlertMessage("Library settings updated successfully!");
        setShowAlert(true);

        PubSub.publish('RECORD_SAVED_TOAST', {
          title: 'Success',
          message: 'Library settings updated successfully!'
        });
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setAlertMessage("Failed to update settings. Please try again.");
      setShowAlert(true);

      PubSub.publish('RECORD_ERROR_TOAST', {
        title: 'Error',
        message: 'Failed to update library settings'
      });
    }
  };

  const handleSettingsCancel = () => {
    setIsEditingSettings(false);
    setTempSettings({ ...librarySettings });
  };

  const handleSettingChange = (key, value) => {
    setTempSettings((prev) => ({
      ...prev,
      [key]: parseInt(value) || value,
    }));
  };

  return (
    <Container fluid className="py-4 detail-h4">
      <Row className="justify-content-center">
        <Col lg={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div
                className="d-flex justify-content-between align-items-center mb-4 p-2"
                style={{
                  color: "var(--primary-color)",
                  background: "var(--primary-background-color)",
                  borderRadius: "10px",
                }}
              >
                <h5
                  className="fw-bold mb-1"
                  style={{ color: "var(--primary-color)" }}
                >
                  <i className="fa-solid fa-id-card me-2 fs-6"></i>
                  Setting Management
                </h5>
                {!isEditingSettings ? (
                  <button
                    onClick={handleSettingsEdit}
                    className="custom-btn-table-header "
                  >
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Settings
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button
                      className="custom-btn-primary"
                      onClick={handleSettingsSave}
                    >
                      <i className="fa-solid fa-check me-2"></i>
                      Save
                    </button>
                    <button
                      className="custom-btn-secondary"
                      onClick={handleSettingsCancel}
                    >
                      <i className="fa-solid fa-times me-2"></i>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <Row className="mt-4">
                <Col md={12} className="mb-4">
                  <h6
                    className="fw-bold mb-0 d-flex align-items-center justify-content-between p-3 border rounded"
                    style={{
                      color: "var(--primary-color)",
                         background: "var(--primary-background-color)",
                      borderRadius: "10px",
                    }}
                  >
                    Setting Information
                  </h6>
                </Col>
                <Row className="px-5">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Maximum Books Per Card
                        <Badge bg="info" className="ms-2">
                          Current: {librarySettings.max_books_per_card}
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="1"
                            max="10"
                            value={tempSettings.max_books_per_card}
                            onChange={(e) =>
                              handleSettingChange(
                                "max_books_per_card",
                                e.target.value
                              )
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Maximum number of books that can be issued on one
                            Library Member
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            {librarySettings.max_books_per_card} books
                          </span>
                          <small className="text-muted d-block mt-1">
                            Maximum number of books that can be issued on one
                            Library Member
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Book Issue (Days)
                        <Badge bg="info" className="ms-2">
                          Current: {librarySettings.duration_days}
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="1"
                            max="30"
                            value={tempSettings.duration_days}
                            onChange={(e) =>
                              handleSettingChange(
                                "duration_days",
                                e.target.value
                              )
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Number of days a book can be issued for
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            {librarySettings.duration_days} days
                          </span>
                          <small className="text-muted d-block mt-1">
                            Number of days a book can be issued for
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Fine Per Day (₹)
                        <Badge bg="info" className="ms-2">
                          Current: ₹{librarySettings.fine_per_day}
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            value={tempSettings.fine_per_day}
                            onChange={(e) =>
                              handleSettingChange(
                                "fine_per_day",
                                e.target.value
                              )
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Fine amount for each day after due date
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            ₹{librarySettings.fine_per_day} per day
                          </span>
                          <small className="text-muted d-block mt-1">
                            Fine amount for each day after due date
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Renew Limit
                        <Badge bg="info" className="ms-2">
                          Current: {librarySettings.renew_limit}
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="0"
                            max="5"
                            value={tempSettings.renew_limit}
                            onChange={(e) =>
                              handleSettingChange("renew_limit", e.target.value)
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Maximum number of times a book can be renewed
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            {librarySettings.renew_limit} times
                          </span>
                          <small className="text-muted d-block mt-1">
                            Maximum number of times a book can be renewed
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Max Issues Per Day
                        <Badge bg="info" className="ms-2">
                          Current: {librarySettings.max_issue_per_day}
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="1"
                            max="10"
                            value={tempSettings.max_issue_per_day}
                            onChange={(e) =>
                              handleSettingChange(
                                "max_issue_per_day",
                                e.target.value
                              )
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Maximum books that can be issued in one day per user
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            {librarySettings.max_issue_per_day} books/day
                          </span>
                          <small className="text-muted d-block mt-1">
                            Maximum books that can be issued in one day per user
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Lost Book Fine (%)
                        <Badge bg="info" className="ms-2">
                          Current: {librarySettings.lost_book_fine_percentage}%
                        </Badge>
                      </Form.Label>
                      {isEditingSettings ? (
                        <>
                          <Form.Control
                            type="number"
                            min="0"
                            max="200"
                            value={tempSettings.lost_book_fine_percentage}
                            onChange={(e) =>
                              handleSettingChange(
                                "lost_book_fine_percentage",
                                e.target.value
                              )
                            }
                            style={{
                              border: "2px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "10px",
                            }}
                          />
                          <small className="text-muted d-block mt-1">
                            Fine for lost books as percentage of book price
                          </small>
                        </>
                      ) : (
                        <div className="p-3 border rounded bg-light">
                          <span className="fw-bold text-primary">
                            {librarySettings.lost_book_fine_percentage}% of book
                            price
                          </span>
                          <small className="text-muted d-block mt-1">
                            Fine for lost books as percentage of book price
                          </small>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
