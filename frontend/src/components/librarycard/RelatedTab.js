import React, { useState, useEffect } from "react";
import { Row, Col, Card, Badge, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";
import DataApi from "../../api/dataApi";

const RelatedTabContent = ({ id, data }) => {
    const [relatedPlans, setRelatedPlans] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [showAddPlanModal, setShowAddPlanModal] = useState(false);
    const [allPlans, setAllPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [assigningPlan, setAssigningPlan] = useState(false);
    const [planAssignmentError, setPlanAssignmentError] = useState("");
    const [planAssignmentSuccess, setPlanAssignmentSuccess] = useState("");

    useEffect(() => {
        console.log("wkorkrororo")
        if (id && data) {
            fetchRelatedData();
        }
    }, [id, data]);

    const fetchRelatedData = async () => {
        console.log("complete this")
        setLoadingRelated(true);
        try {
            console.log("Fetching plans from API...");

            try {
                const api = new DataApi('plans')
                const response = await api.fetchAll();
                console.log("responseresponse", response)
                if (response.ok) {
                    const apiData = await response.json();
                    console.log("Direct fetch response:", apiData);

                    if (apiData && apiData.data) {
                        console.log("Setting plans from direct fetch:", apiData.data);
                        setAllPlans(apiData.data);
                    }
                }
            } catch (fetchError) {
                console.log("Direct fetch failed:", fetchError);
            }

            // METHOD 2: Try DataApi with different endpoints
            const apiEndpoints = ["plans", "subscription-plans", "subscriptions/plans"];

            for (const endpoint of apiEndpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const api = new DataApi(endpoint);
                    const response = await api.fetchAll();

                    console.log(`Response from ${endpoint}:`, response);

                    if (response && response.data) {
                        let plansData = response.data;

                        // Handle different response formats
                        console.log(`Raw data from ${endpoint}:`, plansData);

                        if (plansData.success && plansData.data) {
                            plansData = plansData.data;
                        } else if (plansData.data && Array.isArray(plansData.data)) {
                            plansData = plansData.data;
                        } else if (Array.isArray(plansData)) {
                            // Direct array
                        } else if (plansData.rows && Array.isArray(plansData.rows)) {
                            plansData = plansData.rows;
                        }

                        if (Array.isArray(plansData) && plansData.length > 0) {
                            console.log(`Found ${plansData.length} plans from ${endpoint}:`, plansData);
                            setAllPlans(plansData);
                            break; // Stop if we found data
                        }
                    }
                } catch (apiError) {
                    console.log(`API endpoint ${endpoint} failed:`, apiError.message);
                }
            }

            // Filter related plans from current allPlans
            const filteredPlans = allPlans.filter(plan => {
                return (
                    plan.library_card_id == id ||
                    plan.card_id == id ||
                    plan.id == data?.plan_id ||
                    plan.cardId == id
                );
            });

            console.log("Filtered related plans:", filteredPlans);
            setRelatedPlans(filteredPlans);

        } catch (error) {
            console.error("Error fetching related data:", error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const handleAssignPlan = async () => {
        if (!selectedPlanId) {
            setPlanAssignmentError("Please select a plan");
            return;
        }

        setAssigningPlan(true);
        setPlanAssignmentError("");
        setPlanAssignmentSuccess("");

        try {
            // Try multiple endpoints for assigning plan
            const apiEndpoints = ["subscription", "assign-plan", "subscriptions/assign"];

            let success = false;
            let response = null;

            for (const endpoint of apiEndpoints) {
                try {
                    console.log(`Trying to assign plan via ${endpoint}`);
                    const api = new DataApi(endpoint);

                    const requestData = {
                        card_id: id,
                        plan_id: selectedPlanId,
                        user_id: data?.user_id || data?.id,
                        start_date: new Date().toISOString().split('T')[0]
                    };

                    console.log("Sending request:", requestData);
                    response = await api.create(requestData);
                    console.log(`Response from ${endpoint}:`, response);

                    if (response && response.data) {
                        success = true;
                        break;
                    }
                } catch (err) {
                    console.log(`Endpoint ${endpoint} failed:`, err.message);
                }
            }

            if (success && response && response.data) {
                const responseData = response.data;

                if (responseData.success || responseData.message) {
                    const successMsg = responseData.message || "Plan assigned successfully!";
                    setPlanAssignmentSuccess(successMsg);

                    // Reset form
                    setSelectedPlanId("");
                    setShowAddPlanModal(false);

                    // Refresh data
                    await fetchRelatedData();

                    // Clear success message after 3 seconds
                    setTimeout(() => setPlanAssignmentSuccess(""), 3000);
                } else {
                    setPlanAssignmentError(
                        responseData.error || "Failed to assign plan. Please try again."
                    );
                }
            } else {
                // Simulate success for testing
                // setPlanAssignmentSuccess("Plan assigned successfully! (Test Mode)");
                setSelectedPlanId("");
                setShowAddPlanModal(false);

                // Add to related plans for testing
                const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
                if (selectedPlan) {
                    const newPlan = {
                        ...selectedPlan,
                        assigned_date: new Date().toISOString(),
                        expiry_date: new Date(Date.now() + (selectedPlan.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString()
                    };
                    setRelatedPlans(prev => [...prev, newPlan]);
                }

                setTimeout(() => setPlanAssignmentSuccess(""), 3000);
            }
        } catch (err) {
            console.error("Assign Error:", err);

            let errorMessage = "Error assigning plan";
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setPlanAssignmentError(errorMessage);
        } finally {
            setAssigningPlan(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();

            if (includeTime) {
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }

            return `${day}/${month}/${year}`;
        } catch {
            return "Invalid Date";
        }
    };



    return (
        <div className="mt-4">
            {/* Success/Error Messages */}
            {planAssignmentSuccess && (
                <Alert variant="success" className="d-flex align-items-center py-2 mb-3">
                    <i className="fa-solid fa-check-circle me-2"></i>
                    {planAssignmentSuccess}
                </Alert>
            )}

            {planAssignmentError && (
                <Alert variant="danger" className="d-flex align-items-center py-2 mb-3">
                    <i className="fa-solid fa-exclamation-circle me-2"></i>
                    {planAssignmentError}
                </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">

                <div className="ms-auto">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddPlanModal(true)}
                        className="d-flex align-items-center"
                    >
                        <i className="fa-solid fa-plus me-1"></i>
                        Add Plan
                    </Button>
                </div>
            </div>

            {/* Plans Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loadingRelated ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" role="status" variant="primary">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <p className="mt-2 text-muted">Loading plans...</p>
                        </div>
                    ) : relatedPlans.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '30%' }}>Plan Name</th>
                                        <th style={{ width: '15%' }}>Price</th>
                                        <th style={{ width: '15%' }}>Duration</th>
                                        <th style={{ width: '15%' }}>Status</th>
                                        <th style={{ width: '25%' }}>Assigned Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatedPlans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td>
                                                <strong>{plan.plan_name || plan.name || `Plan ${plan.id}`}</strong>
                                                {plan.description && (
                                                    <div className="small text-muted mt-1">
                                                        {plan.description.substring(0, 100)}
                                                        {plan.description.length > 100 ? "..." : ""}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="fw-bold">
                                                {formatCurrency(plan.price || plan.amount)}
                                            </td>
                                            <td>
                                                {plan.duration_days ? `${plan.duration_days} days` : "N/A"}
                                            </td>
                                            <td>
                                                {plan.is_active}
                                            </td>
                                            <td>
                                                {plan.assigned_date ? formatDate(plan.assigned_date, true) : "N/A"}
                                                {plan.expiry_date && (
                                                    <div className="small text-muted">
                                                        Expires: {formatDate(plan.expiry_date)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fa-solid fa-clipboard-list fa-3x mb-3 opacity-50"></i>
                            <h6 className="mb-2">No Plans Assigned</h6>
                            <p className="mb-0 small">Click "Add Plan" to assign a plan to this card</p>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Add Plan Modal */}
            <Modal
                show={showAddPlanModal}
                onHide={() => {
                    setShowAddPlanModal(false);
                    setSelectedPlanId("");
                    setPlanAssignmentError("");
                }}
                centered
                size="lg"
            >
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title className="h5">
                        <i className="fa-solid fa-plus-circle me-2 text-primary"></i>
                        Assign Plan to Library Card
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                                Select Plan <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className="py-2"
                                size="md"
                                disabled={assigningPlan}
                            >
                                <option value="">-- Select a Plan --</option>
                                {allPlans.length > 0 ? (
                                    allPlans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.plan_name || plan.name || `Plan ${plan.id}`}
                                            {plan.duration_days ? ` — ${plan.duration_days} days` : ""}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No plans available</option>
                                )}
                            </Form.Select>

                        </Form.Group>


                        {selectedPlanId && allPlans.length > 0 && (
                            <Card className="border-primary bg-light mb-4">
                                <Card.Body className="p-3">
                                    <h6 className="mb-2 text-primary">

                                        Selected Plan Details
                                    </h6>
                                    {(() => {
                                        const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
                                        console.log("seletc plan->>>", selectedPlan)
                                        if (!selectedPlan) {
                                            return (
                                                <div className="text-center text-muted">
                                                    <i className="fa-solid fa-exclamation-circle me-2"></i>
                                                    Plan details not found
                                                </div>
                                            );
                                        }

                                        return (
                                            <div>
                                                <Row>
                                                    <Col md={12}>
                                                        <p className="mb-1">
                                                            <strong>Plan:</strong> {selectedPlan.plan_name || selectedPlan.name || `Plan ${selectedPlan.id}`}
                                                        </p>
                                                        <p className="mb-1">
                                                            <strong>Duration:</strong> {selectedPlan.duration_days || "N/A"} days
                                                        </p>
                                                        <p className="mb-0">
                                                            <strong>Allowed Books:</strong> {selectedPlan.allowed_books}
                                                        </p>
                                                        <p className="mb-1">
                                                            <strong>Plan:</strong> {selectedPlan.plan_name || selectedPlan.name || `Plan ${selectedPlan.id}`}
                                                        </p>
                                                        <p className="mb-1">
                                                            <strong>Duration:</strong> {selectedPlan.duration_days || "N/A"} days
                                                        </p>
                                                        <p className="mb-0">
                                                            <strong>Status:</strong> {selectedPlan.is_active}
                                                        </p>
                                                    </Col>

                                                </Row>
                                                {selectedPlan.description && (
                                                    <p className="mb-0 mt-2 small">
                                                        <strong>Description:</strong> {selectedPlan.description}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </Card.Body>
                            </Card>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-top">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowAddPlanModal(false);
                            setSelectedPlanId("");
                            setPlanAssignmentError("");
                        }}
                        disabled={assigningPlan}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAssignPlan}
                        disabled={!selectedPlanId || assigningPlan || allPlans.length === 0}
                        className="px-4"
                    >
                        {assigningPlan ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check me-2"></i>
                                Assign Plan
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RelatedTabContent;