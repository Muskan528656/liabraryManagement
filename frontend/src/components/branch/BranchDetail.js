import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { API_BASE_URL } from '../../constants/CONSTANT';
import helper from '../common/helper';

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    branch_code: '',
    branch_name: '',
    address_line1: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchBranch();
    }
  }, [id]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const response = await helper.fetchWithAuth(
        `${API_BASE_URL}/api/branch/${id}`,
        'GET'
      );
      
      const result = await response.json();
      
      if (result.success) {
        setBranch(result.data);
        setFormData({
          branch_code: result.data.branch_code,
          branch_name: result.data.branch_name,
          address_line1: result.data.address_line1 || '',
          city: result.data.city || '',
          state: result.data.state || '',
          country: result.data.country || '',
          pincode: result.data.pincode || '',
          is_active: result.data.is_active
        });
      } else {
        setError(result.message || 'Failed to fetch branch');
      }
    } catch (err) {
      setError('Error fetching branch: ' + err.message);
      console.error('Error fetching branch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.branch_code.trim()) {
      alert('Branch code is required');
      return false;
    }
    if (!formData.branch_name.trim()) {
      alert('Branch name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      let response;
      if (id === 'new') {
        // Create new branch
        response = await helper.fetchWithAuth(
          `${API_BASE_URL}/api/branch`,
          'POST',
          JSON.stringify(formData)
        );
      } else {
        // Update existing branch
        response = await helper.fetchWithAuth(
          `${API_BASE_URL}/api/branch/${id}`,
          'PUT',
          JSON.stringify(formData)
        );
      }

      const result = await response.json();
      
      if (result.success) {
        if (id === 'new') {
          alert('Branch created successfully!');
        } else {
          alert('Branch updated successfully!');
        }
        navigate('/branches'); // Navigate back to the list
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (err) {
      alert('Error saving branch: ' + err.message);
      console.error('Error saving branch:', err);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/branches');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await helper.fetchWithAuth(
        `${API_BASE_URL}/api/branch/${id}`,
        'DELETE'
      );

      const result = await response.json();
      
      if (result.success) {
        alert('Branch deleted successfully!');
        navigate('/branches');
      } else {
        alert(result.message || 'Failed to delete branch');
      }
    } catch (err) {
      alert('Error deleting branch: ' + err.message);
      console.error('Error deleting branch:', err);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Row>
          <Col>
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/branches')}
                  className="me-3"
                >
                  <i className="fa-solid fa-arrow-left"></i> Back to List
                </Button>
                {id === 'new' ? 'Add New Branch' : `Branch Details: ${branch?.branch_name}`}
              </div>
              {id !== 'new' && !isEditing && (
                <Button 
                  variant="primary" 
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fa-solid fa-save"></i> Edit Branch
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="branch_code"
                    value={formData.branch_code}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing && id !== 'new'}
                    placeholder="Enter branch code (e.g., BR001)"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Branch Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing && id !== 'new'}
                    placeholder="Enter branch name"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    disabled={!isEditing && id !== 'new'}
                    placeholder="Enter address"
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing && id !== 'new'}
                        placeholder="Enter city"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={!isEditing && id !== 'new'}
                        placeholder="Enter state"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!isEditing && id !== 'new'}
                        placeholder="Enter country"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode</Form.Label>
                      <Form.Control
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        disabled={!isEditing && id !== 'new'}
                        placeholder="Enter pincode"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    disabled={!isEditing && id !== 'new'}
                    label="Branch is Active"
                  />
                </Form.Group>

                {(isEditing || id === 'new') && (
                  <div className="d-flex gap-2">
                    <Button variant="primary" type="submit">
                      <i className="fa-solid fa-save"></i> Save Branch
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                        <i className="fa-solid fa-times"></i> Cancel
                    </Button>
                    </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BranchDetail;