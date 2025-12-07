import React, { useState, useEffect } from "react";
import { Modal, Button, Form, ListGroup, Alert, Spinner } from "react-bootstrap";
import DataApi from "../../api/dataApi";
import PubSub from "pubsub-js";

const PlanSelectionModal = ({ show, onHide, onSelectPlan, selectedPlanId = null }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(selectedPlanId);

  useEffect(() => {
    if (show) {
      fetchPlans();
    }
  }, [show]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const api = new DataApi("plans");
      const response = await api.fetchAll();
      
      let plansList = [];
      if (response && response.data) {
        plansList = Array.isArray(response.data) ? response.data : [response.data];

        plansList = plansList.filter(p => p.isactive !== false);
      }
      
      setPlans(plansList);
      setSelectedPlan(selectedPlanId);
    } catch (error) {
      console.error("Error fetching plans:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch plans",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      const selectedPlanObj = plans.find(p => p.id === selectedPlan);
      onSelectPlan(selectedPlanObj);
      onHide();
    } else {
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Please select a plan",
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fa-solid fa-tags me-2"></i>
          Select Plan
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2 text-muted">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <Alert variant="warning">
            <i className="fa-solid fa-exclamation-triangle me-2"></i>
            No active plans available
          </Alert>
        ) : (
          <>
            <p className="text-muted mb-3">Select a plan for this library card member:</p>
            <ListGroup>
              {plans.map((plan) => (
                <ListGroup.Item
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className="cursor-pointer"
                  style={{
                    background: selectedPlan === plan.id ? "var(--primary-background-color)" : "white",
                    border: selectedPlan === plan.id ? "2px solid var(--primary-color)" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    padding: "15px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 fw-bold" style={{ color: "var(--primary-color)" }}>
                        <i className="fa-solid fa-check-circle me-2"></i>
                        {plan.plan_name}
                      </h6>
                      <p className="mb-0 small text-muted">
                        <i className="fa-solid fa-calendar-days me-2"></i>
                        {plan.duration_days} days validity
                      </p>
                    </div>
                    <div>
                      {selectedPlan === plan.id && (
                        <i className="fa-solid fa-check-circle" style={{ fontSize: "24px", color: "var(--primary-color)" }}></i>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fa-solid fa-times me-2"></i>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirm}
          disabled={!selectedPlan || loading}
        >
          <i className="fa-solid fa-check me-2"></i>
          Select Plan
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PlanSelectionModal;
