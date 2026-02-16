import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { API_BASE_URL } from '../../constants/CONSTANT';
import helper from '../common/helper';

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
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

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await helper.fetchWithAuth(
        `${API_BASE_URL}/api/branch`,
        'GET'
      );
      
      const result = await response.json();
      
      if (result.success) {
        setBranches(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch branches');
      }
    } catch (err) {
      setError('Error fetching branches: ' + err.message);
      console.error('Error fetching branches:', err);
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
      if (editingBranch) {
        // Update existing branch
        response = await helper.fetchWithAuth(
          `${API_BASE_URL}/api/branch/${editingBranch.id}`,
          'PUT',
          JSON.stringify(formData)
        );
      } else {
        // Create new branch
        response = await helper.fetchWithAuth(
          `${API_BASE_URL}/api/branch`,
          'POST',
          JSON.stringify(formData)
        );
      }

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setFormData({
          branch_code: '',
          branch_name: '',
          address_line1: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          is_active: true
        });
        setEditingBranch(null);
        fetchBranches(); // Refresh the list
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (err) {
      alert('Error saving branch: ' + err.message);
      console.error('Error saving branch:', err);
    }
  };

  const handleEdit = (branch) => {
    setFormData({
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      address_line1: branch.address_line1 || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || '',
      pincode: branch.pincode || '',
      is_active: branch.is_active
    });
    setEditingBranch(branch);
    setShowModal(true);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      const response = await helper.fetchWithAuth(
        `${API_BASE_URL}/api/branch/${branchId}`,
        'DELETE'
      );

      const result = await response.json();
      
      if (result.success) {
        fetchBranches(); // Refresh the list
      } else {
        alert(result.message || 'Failed to delete branch');
      }
    } catch (err) {
      alert('Error deleting branch: ' + err.message);
      console.error('Error deleting branch:', err);
    }
  };

  const handleNewBranch = () => {
    setFormData({
      branch_code: '',
      branch_name: '',
      address_line1: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      is_active: true
    });
    setEditingBranch(null);
    setShowModal(true);
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
              <h4>Branch Management</h4>
              <Button variant="primary" onClick={handleNewBranch}>
                <i className="fa-solid fa-plus"></i> Add Branch
              </Button>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}
              
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Branch Code</th>
                    <th>Branch Name</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(branch => (
                    <tr key={branch.id}>
                      <td>{branch.branch_code}</td>
                      <td>{branch.branch_name}</td>
                      <td>{branch.city || '-'}</td>
                      <td>{branch.state || '-'}</td>
                      <td>{branch.country || '-'}</td>
                      <td>
                        <span className={`badge ${branch.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                          className="me-2"
                        >
                          <i className="fa-solid fa-edit"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(branch.id)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {branches.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No branches found. Click "Add Branch" to create one.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Branch Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBranch ? 'Edit Branch' : 'Add New Branch'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Branch Code *</Form.Label>
              <Form.Control
                type="text"
                name="branch_code"
                value={formData.branch_code}
                onChange={handleInputChange}
                required
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
                label="Branch is Active"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              <i className="fa-solid fa-times"></i> Cancel
            </Button>
            <Button variant="primary" type="submit">
              <i className="fa-solid fa-save"></i> {editingBranch ? 'Update' : 'Create'} Branch
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default BranchList;