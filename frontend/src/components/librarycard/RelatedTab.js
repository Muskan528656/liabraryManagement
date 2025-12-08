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
        console.log("Component mounted with ID:", id, "Data:", data);
        if (id && data) {
            fetchRelatedData();
        }
    }, [id, data]);

    const fetchRelatedData = async () => {
        console.log("Fetching related data...");
        setLoadingRelated(true);
        try {
            console.log("Fetching plans from API...");


            const api = new DataApi('plans');
            const plansResponse = await api.fetchAll();
            console.log("Plans API response:", plansResponse);

            if (plansResponse && plansResponse.data) {
                const plansData = plansResponse.data;
                console.log("Plans data:", plansData);


                let plansArray = [];
                if (plansData.success && plansData.data && Array.isArray(plansData.data)) {
                    plansArray = plansData.data;
                } else if (Array.isArray(plansData)) {
                    plansArray = plansData;
                } else if (plansData.data && Array.isArray(plansData.data)) {
                    plansArray = plansData.data;
                }

                console.log("Setting plans:", plansArray);
                setAllPlans(plansArray);


                console.log("Fetching subscriptions for card:", id);
                try {

                    const subscriptionEndpoints = [
                        "subscriptions",
                        "member-subscriptions",
                        "subscriptions/list"
                    ];

                    let subscriptionsData = [];

                    for (const endpoint of subscriptionEndpoints) {
                        try {
                            const subApi = new DataApi(endpoint);
                            const subResponse = await subApi.fetchAll();

                            console.log(`Subscriptions response from ${endpoint}:`, subResponse);

                            if (subResponse && subResponse.data) {
                                let responseData = subResponse.data;


                                if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
                                    subscriptionsData = responseData.data;
                                    break;
                                } else if (Array.isArray(responseData)) {
                                    subscriptionsData = responseData;
                                    break;
                                } else if (responseData.data && Array.isArray(responseData.data)) {
                                    subscriptionsData = responseData.data;
                                    break;
                                }
                            }
                        } catch (subError) {
                            console.log(`Endpoint ${endpoint} failed:`, subError.message);
                        }
                    }

                    if (subscriptionsData.length > 0) {

                        const memberSubscriptions = subscriptionsData.filter(sub => {
                            return (
                                sub.member_id == id ||
                                sub.card_id == id ||
                                sub.library_card_id == id ||
                                sub.user_id == data?.user_id
                            );
                        });

                        console.log("Found member subscriptions:", memberSubscriptions);


                        const enrichedPlans = memberSubscriptions.map(subscription => {
                            const plan = plansArray.find(p => p.id == subscription.plan_id);
                            return {
                                ...plan,
                                ...subscription,
                                subscription_id: subscription.id || subscription.subscription_id,
                                assigned_date: subscription.start_date || subscription.assigned_date,
                                expiry_date: subscription.end_date || subscription.expiry_date,
                                is_active: subscription.is_active !== undefined ? subscription.is_active : true
                            };
                        });

                        console.log("Enriched plans with subscription:", enrichedPlans);
                        setRelatedPlans(enrichedPlans);
                    } else {

                        console.log("No subscription data found, checking card plan_id");

                        if (data?.plan_id) {
                            const cardPlan = plansArray.find(plan => plan.id === data.plan_id);
                            if (cardPlan) {
                                console.log("Found plan from card data:", cardPlan);
                                setRelatedPlans([{
                                    ...cardPlan,
                                    assigned_date: data.createddate || new Date().toISOString()
                                }]);
                            } else {
                                setRelatedPlans([]);
                            }
                        } else {
                            setRelatedPlans([]);
                        }
                    }
                } catch (subscriptionError) {
                    console.log("Error fetching subscriptions:", subscriptionError);


                    if (data?.plan_id) {
                        const cardPlan = plansArray.find(plan => plan.id === data.plan_id);
                        if (cardPlan) {
                            setRelatedPlans([{
                                ...cardPlan,
                                assigned_date: data.createddate || new Date().toISOString()
                            }]);
                        } else {
                            setRelatedPlans([]);
                        }
                    } else {
                        setRelatedPlans([]);
                    }
                }
            } else {
                console.error("Failed to fetch plans");
                setAllPlans([]);
                setRelatedPlans([]);
            }

        } catch (error) {
            console.error("Error fetching related data:", error);
            setAllPlans([]);
            setRelatedPlans([]);
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

            const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
            if (!selectedPlan) {
                setPlanAssignmentError("Selected plan not found");
                setAssigningPlan(false);
                return;
            }


            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (selectedPlan.duration_days || 30));


            const subscriptionData = {
                plan_id: selectedPlanId,
                member_id: id, // Library card ID
                user_id: data?.user_id || data?.id, // User ID
                card_id: id, // Card ID
                plan_name: selectedPlan.plan_name || selectedPlan.name,
                duration_days: selectedPlan.duration_days || 30,
                allowed_books: selectedPlan.allowed_books || 0,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                is_active: true,
                status: "active"
            };

            console.log("Subscription data:", subscriptionData);


            const api = new DataApi('subscriptions');
            const response = await api.create(subscriptionData);

            console.log("Subscription response:", response);

            if (response && response.data && response.data.success) {
                const successMessage = response.data.message || "Subscription created successfully!";
                setPlanAssignmentSuccess(successMessage);


                setSelectedPlanId("");
                setShowAddPlanModal(false);


                await fetchRelatedData();


                setTimeout(() => setPlanAssignmentSuccess(""), 3000);
            } else {
                const errorMsg = response?.data?.error || "Failed to create subscription";
                setPlanAssignmentError(errorMsg);
            }

        } catch (err) {
            console.error("Subscription creation error:", err);

            let errorMessage = "Error creating subscription";
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

    const getStatusBadge = (isActive) => {
        if (isActive === true || isActive === "true") {
            return <Badge bg="success" className="px-2 py-1">Active</Badge>;
        } else if (isActive === false || isActive === "false") {
            return <Badge bg="danger" className="px-2 py-1">Inactive</Badge>;
        } else {
            return <Badge bg="warning" className="px-2 py-1">Unknown</Badge>;
        }
    };

    return (
        <div className="mt-4">
            {/* Success/Error Messages */}
            {planAssignmentSuccess && (
                <Alert variant="success" dismissible onClose={() => setPlanAssignmentSuccess("")}>
                    <i className="fa-solid fa-circle-check me-2"></i>
                    {planAssignmentSuccess}
                </Alert>
            )}

            {planAssignmentError && (
                <Alert variant="danger" dismissible onClose={() => setPlanAssignmentError("")}>
                    <i className="fa-solid fa-circle-exclamation me-2"></i>
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
                                        <th style={{ width: '25%' }}>Plan Details</th>
                                        <th style={{ width: '25%' }}>Allowed Books</th>
                                        <th style={{ width: '15%' }}>Duration</th>
                                        <th style={{ width: '15%' }}>Status</th>
                                        <th style={{ width: '25%' }}>Subscription Period</th>
                                        {/* <th style={{ width: '20%' }}>Actions</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatedPlans.map((plan) => (
                                        <tr key={plan.subscription_id || plan.id}>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <strong>{plan.plan_name || plan.name || `Plan ${plan.id}`}</strong>


                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">

                                                    {plan.allowed_books && (
                                                        <small className="text-muted mt-1">
                                                            {plan.allowed_books} books allowed
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span>{plan.duration_days ? `${plan.duration_days} days` : ""}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(plan.is_active)}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <small>
                                                        <strong>Start:</strong> {formatDate(plan.start_date || plan.assigned_date || plan.createddate)}
                                                    </small>
                                                    <small>
                                                        <strong>End:</strong> {formatDate(plan.end_date || plan.expiry_date)}
                                                    </small>
                                                    {plan.end_date && new Date(plan.end_date) < new Date() && (
                                                        <small className="text-danger">
                                                            <i className="fa-solid fa-clock me-1"></i>
                                                            Expired
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            {/* <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => {

                                                            console.log("View subscription:", plan);
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => {

                                                            if (window.confirm("Are you sure you want to cancel this subscription?")) {
                                                                console.log("Cancel subscription:", plan.subscription_id || plan.id);
                                                            }
                                                        }}
                                                        disabled={!plan.is_active}
                                                    >
                                                        <i className="fa-solid fa-ban"></i>
                                                    </Button>
                                                </div>
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="fa-solid fa-clipboard-list fa-3x mb-3 opacity-50"></i>
                            <h6 className="mb-2">No Plans Assigned</h6>
                            <p className="mb-0 small">Click "Add Plan" to assign a subscription plan to this card</p>
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
                    setPlanAssignmentSuccess("");
                }}
                centered
                size="lg"
                backdrop="static"
            >
                <Modal.Header closeButton className="border-bottom">
                    <Modal.Title className="h5">
                        Create New Subscription
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
                                onChange={(e) => {
                                    setSelectedPlanId(e.target.value);
                                    setPlanAssignmentError("");
                                }}
                                className="py-2"
                                size="md"
                                disabled={assigningPlan}
                            >
                                <option value="">-- Select a Plan --</option>
                                {allPlans.length > 0 ? (
                                    allPlans
                                        .filter(plan => plan.is_active !== false)
                                        .map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.plan_name || plan.name || `Plan ${plan.id}`}
                                                {plan.duration_days ? ` — ${plan.duration_days} days` : ""}
                                                {plan.allowed_books ? ` — ${plan.allowed_books} books` : ""}
                                            </option>
                                        ))
                                ) : (
                                    <option value="" disabled>Loading plans...</option>
                                )}
                            </Form.Select>
                            <Form.Text className="text-muted">
                                This will create a new subscription record in the database
                            </Form.Text>
                        </Form.Group>

                        {selectedPlanId && allPlans.length > 0 && (
                            <>
                                {/* Plan Details Card */}
                                <Card className="bg-light mb-4">
                                    <Card.Body className="p-3">

                                        {(() => {
                                            const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
                                            if (!selectedPlan) {
                                                return (
                                                    <div className="text-center text-muted">
                                                        <i className="fa-solid fa-exclamation-circle me-2"></i>
                                                        Plan details not found
                                                    </div>
                                                );
                                            }


                                            const startDate = new Date();
                                            const endDate = new Date(startDate);
                                            endDate.setDate(startDate.getDate() + (selectedPlan.duration_days || 30));

                                            return (
                                                <div>
                                                    <Row>
                                                        <Col md={6}>
                                                            <p className="mb-2">
                                                                <strong>Plan Name:</strong><br />
                                                                {selectedPlan.plan_name || selectedPlan.name || `Plan ${selectedPlan.id}`}
                                                            </p>
                                                            <p className="mb-2">
                                                                <strong>Duration:</strong><br />
                                                                {selectedPlan.duration_days || "30"} days
                                                            </p>
                                                            <p className="mb-2">
                                                                <strong>Allowed Books:</strong><br />
                                                                {selectedPlan.allowed_books || "Unlimited"}
                                                            </p>
                                                        </Col>
                                                        <Col md={6}>
                                                            <p className="mb-2">
                                                                <strong>Status:</strong><br />
                                                                {getStatusBadge(selectedPlan.is_active)}
                                                            </p>
                                                            <p className="mb-2">
                                                                <strong>Start Date:</strong><br />
                                                                {formatDate(startDate.toISOString())}
                                                            </p>
                                                            <p className="mb-0">
                                                                <strong>End Date:</strong><br />
                                                                {formatDate(endDate.toISOString())}
                                                            </p>
                                                        </Col>
                                                    </Row>


                                                </div>
                                            );
                                        })()}
                                    </Card.Body>
                                </Card>

                            </>
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
                            setPlanAssignmentSuccess("");
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
                                Creating Subscription...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check-circle me-2"></i>
                                Create Subscription
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RelatedTabContent;