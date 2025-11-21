import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Table } from 'react-bootstrap';
import DataApi from '../../api/dataApi';
import PubSub from 'pubsub-js';

const Company = () => {
  const [Company, setCompany] = useState({
    max_books_per_card: 1,
    duration_days: 15,
    fine_per_day: 10,
    renew_limit: 2,
    max_issue_per_day: 1,
    lost_book_fine_percentage: 100
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorAuth, setTwoFactorAuth] = useState('text');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempCompany, setTempCompany] = useState({ ...Company });

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlertMessage('New password and confirm password do not match!');
      setShowAlert(true);
      return;
    }

    if (newPassword.length < 6) {
      setAlertMessage('Password must be at least 6 characters long!');
      setShowAlert(true);
      return;
    }

    setAlertMessage('Password changed successfully! You will be logged out of all devices.');
    setShowAlert(true);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleTwoFactorChange = (method) => {
    setTwoFactorAuth(method);
  };

  // Fetch settings from backend
  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const settingsApi = new DataApi('librarysettings');
      const response = await settingsApi.get('/all');
      if (response.data && response.data.success) {
        const Company = response.data.data;
        // Convert key-value pairs to object
        const settingsObj = {
          max_books_per_card: parseInt(Company.max_books_per_card || 1),
          duration_days: parseInt(Company.duration_days || 15),
          fine_per_day: parseInt(Company.fine_per_day || 10),
          renew_limit: parseInt(Company.renew_limit || 2),
          max_issue_per_day: parseInt(Company.max_issue_per_day || 1),
          lost_book_fine_percentage: parseInt(Company.lost_book_fine_percentage || 100)
        };
        setCompany(settingsObj);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);

    }
  };

  const handleCompanyEdit = () => {
    setIsEditingCompany(true);
    setTempCompany({ ...Company });
  };

  const handleCompanySave = async () => {
    try {
      const settingsApi = new DataApi('librarysettings');

      const settingsArray = [
        { setting_key: 'max_books_per_card', setting_value: tempCompany.max_books_per_card.toString() },
        { setting_key: 'duration_days', setting_value: tempCompany.duration_days.toString() },
        { setting_key: 'fine_per_day', setting_value: tempCompany.fine_per_day.toString() },
        { setting_key: 'renew_limit', setting_value: tempCompany.renew_limit.toString() },
        { setting_key: 'max_issue_per_day', setting_value: tempCompany.max_issue_per_day.toString() },
        { setting_key: 'lost_book_fine_percentage', setting_value: tempCompany.lost_book_fine_percentage.toString() }
      ];

      const response = await settingsApi.put('/bulk', { settings: settingsArray });

      if (response.data && response.data.success) {
        setCompany({ ...tempCompany });
        setIsEditingCompany(false);
        setAlertMessage('Library settings updated successfully!');
        setShowAlert(true);

        PubSub.publish('RECORD_SAVED_TOAST', {
          title: 'Success',
          message: 'Library settings updated successfully!'
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlertMessage('Failed to update settings. Please try again.');
      setShowAlert(true);

      PubSub.publish('RECORD_ERROR_TOAST', {
        title: 'Error',
        message: 'Failed to update library settings'
      });
    }
  };

  const handleCompanyCancel = () => {
    setIsEditingCompany(false);
    setTempCompany({ ...Company });
  };

  const handleSettingChange = (key, value) => {
    setTempCompany(prev => ({
      ...prev,
      [key]: parseInt(value) || value
    }));
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <div className="mb-4">
            <h2 className="fw-bold mb-1" style={{ color: '#6f42c1' }}>Company</h2>
            <p className="text-muted">Manage your account settings and library configuration</p>
          </div>

          {showAlert && (
            <Alert
              variant={alertMessage.includes('successfully') ? 'success' : 'danger'}
              dismissible
              onClose={() => setShowAlert(false)}
              className="mb-4"
            >
              {alertMessage}
            </Alert>
          )}

          {/* Library Configuration Section */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0" style={{ color: '#6f42c1' }}>Library Configuration</h5>
                {!isEditingCompany ? (
                  <Button
                    variant="outline-primary"
                    onClick={handleCompanyEdit}
                    style={{
                      border: '2px solid #6f42c1',
                      color: '#6f42c1',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fa-solid fa-edit me-2"></i>
                    Edit Company
                  </Button>
                ) : (
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-success"
                      onClick={handleCompanySave}
                      style={{
                        border: '2px solid #28a745',
                        color: '#28a745',
                        borderRadius: '8px',
                        padding: '8px 20px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fa-solid fa-check me-2"></i>
                      Save
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleCompanyCancel}
                      style={{
                        border: '2px solid #6c757d',
                        color: '#6c757d',
                        borderRadius: '8px',
                        padding: '8px 20px',
                        fontWeight: '600'
                      }}
                    >
                      <i className="fa-solid fa-times me-2"></i>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-muted mb-4">
                Configure library rules and policies for book issuance and fines.
              </p>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Maximum Books Per Card
                      <Badge bg="info" className="ms-2">Current: {Company.max_books_per_card}</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={tempCompany.max_books_per_card}
                        onChange={(e) => handleSettingChange('max_books_per_card', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">{Company.max_books_per_card} books</span>
                        <small className="text-muted d-block mt-1">Maximum number of books that can be issued on one   Library Member</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Book  Issue (Days)
                      <Badge bg="info" className="ms-2">Current: {Company.duration_days}</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="1"
                        max="30"
                        value={tempCompany.duration_days}
                        onChange={(e) => handleSettingChange('duration_days', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">{Company.duration_days} days</span>
                        <small className="text-muted d-block mt-1">Number of days a book can be issued for</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Fine Per Day (₹)
                      <Badge bg="info" className="ms-2">Current: ₹{Company.fine_per_day}</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={tempCompany.fine_per_day}
                        onChange={(e) => handleSettingChange('fine_per_day', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">₹{Company.fine_per_day} per day</span>
                        <small className="text-muted d-block mt-1">Fine amount for each day after due date</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Renew Limit
                      <Badge bg="info" className="ms-2">Current: {Company.renew_limit}</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="0"
                        max="5"
                        value={tempCompany.renew_limit}
                        onChange={(e) => handleSettingChange('renew_limit', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">{Company.renew_limit} times</span>
                        <small className="text-muted d-block mt-1">Maximum number of times a book can be renewed</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Max Issues Per Day
                      <Badge bg="info" className="ms-2">Current: {Company.max_issue_per_day}</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={tempCompany.max_issue_per_day}
                        onChange={(e) => handleSettingChange('max_issue_per_day', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">{Company.max_issue_per_day} books/day</span>
                        <small className="text-muted d-block mt-1">Maximum books that can be issued in one day per user</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Lost Book Fine (%)
                      <Badge bg="info" className="ms-2">Current: {Company.lost_book_fine_percentage}%</Badge>
                    </Form.Label>
                    {isEditingCompany ? (
                      <Form.Control
                        type="number"
                        min="0"
                        max="200"
                        value={tempCompany.lost_book_fine_percentage}
                        onChange={(e) => handleSettingChange('lost_book_fine_percentage', e.target.value)}
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <div className="p-3 border rounded bg-light">
                        <span className="fw-bold text-primary">{Company.lost_book_fine_percentage}% of book price</span>
                        <small className="text-muted d-block mt-1">Fine for lost books as percentage of book price</small>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Change Password Section */}

        </Col>
      </Row>
    </Container>
  );
};

export default Company;