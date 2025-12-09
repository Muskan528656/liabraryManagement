import React, { useState, useEffect } from "react";
import { Row, Col, Card, Badge, Button, Form, Spinner, Alert, Collapse } from "react-bootstrap";
import DataApi from "../../api/dataApi";

const RelatedTabContent = ({ id, data }) => {
    const [relatedPlans, setRelatedPlans] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [allPlans, setAllPlans] = useState([]);

    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [expandedPlanId, setExpandedPlanId] = useState(null);

    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [assigningPlan, setAssigningPlan] = useState(false);
    const [notification, setNotification] = useState({ type: "", message: "" });

    useEffect(() => {
        if (id) {
            fetchRelatedData();
        }
    }, [id, data]);

    const fetchRelatedData = async () => {
        setLoadingRelated(true);
        try {

            const api = new DataApi('plans');
            const plansResponse = await api.fetchAll();
            let plansArray = [];
            if (plansResponse?.data?.data && Array.isArray(plansResponse.data.data)) {
                plansArray = plansResponse.data.data;
            } else if (Array.isArray(plansResponse?.data)) {
                plansArray = plansResponse.data;
            } else if (plansResponse?.data && Array.isArray(plansResponse.data)) {
                plansArray = plansResponse.data;
            }
            setAllPlans(plansArray);


            const subApi = new DataApi('subscriptions');
            const subResponse = await subApi.fetchAll();
            let subscriptionsData = [];

            if (subResponse?.data?.data) {
                subscriptionsData = subResponse.data.data;
            } else if (Array.isArray(subResponse?.data)) {
                subscriptionsData = subResponse.data;
            } else if (subResponse?.data && Array.isArray(subResponse.data)) {
                subscriptionsData = subResponse.data;
            }


            let memberSubscriptions = subscriptionsData.filter(sub =>
                String(sub.member_id) === String(id) ||
                String(sub.card_id) === String(id) ||
                String(sub.library_card_id) === String(id) ||
                (data?.user_id && String(sub.user_id) === String(data.user_id))
            );


            let finalPlansList = memberSubscriptions.map(subscription => {
                const planDetails = plansArray.find(p => String(p.id) === String(subscription.plan_id));
                if (!planDetails) return null;

                return {
                    ...planDetails,
                    ...subscription,
                    real_plan_id: planDetails.id,
                    unique_key: `sub-${subscription.id || Math.random()}`,
                    assigned_date: subscription.start_date || subscription.assigned_date,
                    expiry_date: subscription.end_date || subscription.expiry_date,
                    is_active: subscription.is_active !== undefined ? subscription.is_active : true,
                    status: subscription.status,
                    source: 'Record'
                };
            }).filter(Boolean);


            if (data && data.plan_id) {
                const alreadyExists = finalPlansList.some(p => String(p.real_plan_id) === String(data.plan_id));

                if (!alreadyExists) {
                    const directPlan = plansArray.find(p => String(p.id) === String(data.plan_id));
                    if (directPlan) {
                        const startDate = data.createddate || new Date().toISOString();
                        const duration = parseInt(directPlan.duration_days) || 30;
                        const endDate = new Date(new Date(startDate).getTime() + (duration * 86400000)).toISOString();

                        finalPlansList.push({
                            ...directPlan,
                            real_plan_id: directPlan.id,
                            unique_key: `profile-${data.plan_id}`,
                            assigned_date: startDate,
                            expiry_date: endDate,
                            is_active: true,
                            source: 'Profile'
                        });
                    }
                }
            }


            finalPlansList.sort((a, b) => {
                const aActive = new Date(a.expiry_date) > new Date();
                const bActive = new Date(b.expiry_date) > new Date();
                if (aActive === bActive) return new Date(b.assigned_date) - new Date(a.assigned_date);
                return bActive - aActive;
            });

            setRelatedPlans(finalPlansList);

        } catch (error) {
            console.error("Error fetching related data:", error);
            setRelatedPlans([]);
        } finally {
            setLoadingRelated(false);
        }
    };

    const handleAssignPlan = async () => {
        if (!selectedPlanId) return;

        setAssigningPlan(true);
        setNotification({ type: "", message: "" });

        try {
            const selectedPlan = allPlans.find(p => String(p.id) === String(selectedPlanId));
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + (parseInt(selectedPlan.duration_days) || 30));

            const subscriptionData = {
                plan_id: selectedPlanId,
                member_id: id,
                card_id: id,
                user_id: data?.user_id || data?.id,
                plan_name: selectedPlan.plan_name || selectedPlan.name,
                duration_days: selectedPlan.duration_days,
                allowed_books: selectedPlan.allowed_books,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                is_active: true,
                status: "active"
            };

            const api = new DataApi('subscriptions');
            const response = await api.create(subscriptionData);

            if (response && response.data && response.data.success) {
                setNotification({ type: "success", message: "Plan assigned successfully!" });
                setIsAddingPlan(false);
                setSelectedPlanId("");
                await fetchRelatedData();
            } else {
                throw new Error(response?.data?.message || "Failed to create subscription");
            }

        } catch (err) {
            setNotification({ type: "danger", message: err.message || "Error assigning plan" });
        } finally {
            setAssigningPlan(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isPlanActive = (plan) => {
        if (!plan) return false;
        const notExpired = plan.expiry_date ? new Date(plan.expiry_date) >= new Date() : true;
        const recordStatus = String(plan.is_active) === "true" ||
            plan.is_active === true ||
            plan.is_active === 1 ||
            String(plan.status) === "active";

        return notExpired && recordStatus;
    };

    const hasActivePlan = relatedPlans.some(p => isPlanActive(p));

    return (
        <div className="mt-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <p className="text-muted small mb-0">
                        {hasActivePlan ?
                            <span style={{ color: "var(--primary-color)" }} className="fw-bold">
                                <i className="fa-solid fa-circle-check me-1"></i>
                                Plan Active (New assignment disabled)
                            </span> :
                            "No active plans. You can assign a new one."}
                    </p>
                </div>

                {!isAddingPlan && (
                    <Button
                        style={{
                            backgroundColor: " #f3e9fc",
                            borderColor: " #6f42c1",
                            color: "#fff"
                        }}
                        className="rounded px-4 shadow-sm"
                        onClick={() => setIsAddingPlan(true)}
                        disabled={hasActivePlan}
                        title={hasActivePlan ? "Current plan must expire before adding a new one" : "Assign a new plan"}
                    >
                        <i className="fa-solid fa-plus me-2" ></i> Assign Plan
                    </Button>
                )}
            </div>

            {/* Notifications */}
            {notification.message && (
                <Alert variant={notification.type} onClose={() => setNotification({ type: "", message: "" })} dismissible>
                    {notification.message}
                </Alert>
            )}

            {/* Add Plan Panel (Accordion) */}
            <Collapse in={isAddingPlan}>
                <div className="mb-4">
                    <Card className="border-0 shadow-sm bg-light overflow-hidden">
                        {/* Using custom primary color for the left border strip */}
                        <div className="border-start border-5 h-100" style={{ borderColor: "var(--primary-color)" }}>
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0" style={{ color: "var(--primary-color)" }}>
                                        <i className="fa-solid fa-layer-group me-2"></i>
                                        Select New Subscription
                                    </h6>
                                    <Button variant="link" className="text-muted p-0 text-decoration-none" onClick={() => setIsAddingPlan(false)}>
                                        <i className="fa-solid fa-xmark"></i> Close
                                    </Button>
                                </div>

                                <Row className="g-3 align-items-end">
                                    <Col md={8}>
                                        <Form.Label className="small text-muted fw-bold text-uppercase">Available Plans</Form.Label>
                                        <Form.Select
                                            value={selectedPlanId}
                                            onChange={(e) => setSelectedPlanId(e.target.value)}
                                            className="form-control-lg border-0 shadow-sm"
                                        >
                                            <option value="">-- Choose a plan to activate --</option>
                                            {allPlans
                                                .filter(p => p.is_active !== false && p.is_active !== 0)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.plan_name || p.name} ({p.duration_days} Days / {p.allowed_books} Books)
                                                    </option>
                                                ))
                                            }
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Button
                                            style={{
                                                backgroundColor: "var(--primary-color)",
                                                borderColor: "var(--primary-color)"
                                            }}
                                            className="w-100 py-3 shadow-sm fw-bold"
                                            onClick={handleAssignPlan}
                                            disabled={!selectedPlanId || assigningPlan}
                                        >
                                            {assigningPlan ? <Spinner animation="border" size="sm" /> : "Confirm & Activate"}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </div>
                    </Card>
                </div>
            </Collapse>

            {/* Plans List */}
            {relatedPlans.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {relatedPlans.map((plan) => {
                        const active = isPlanActive(plan);
                        const isExpanded = expandedPlanId === plan.unique_key;

                        return (
                            <Card
                                key={plan.unique_key}
                                className={`border-0 shadow-sm transition-all ${active ? '' : 'opacity-75 bg-light'}`}
                                style={{
                                    overflow: 'hidden',

                                    borderLeft: active ? '5px solid var(--primary-color)' : 'none'
                                }}
                            >
                                <div
                                    className="p-3 d-flex align-items-center justify-content-between"
                                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.unique_key)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        {/* Icon Container with Custom Colors */}
                                        <div
                                            className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                                            style={{
                                                width: '45px',
                                                height: '45px',
                                                backgroundColor: active ? "var(--primary-background-color)" : "#e9ecef",
                                                color: active ? "var(--primary-color)" : "#6c757d"
                                            }}
                                        >
                                            <i className={`fa-solid ${active ? 'fa-crown' : 'fa-history'}`}></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold text-dark">{plan.plan_name || plan.name}</h6>
                                            <small className="text-muted">
                                                {formatDate(plan.assigned_date)} — {formatDate(plan.expiry_date)}
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        {active && (
                                            <Badge
                                                className="rounded-pill px-3"
                                                style={{ backgroundColor: "var(--primary-color)" }}
                                            >
                                                Active
                                            </Badge>
                                        )}
                                        <i className={`fa-solid fa-chevron-down text-muted transition-transform ${isExpanded ? 'fa-rotate-180' : ''}`}></i>
                                    </div>
                                </div>

                                <Collapse in={isExpanded}>
                                    <div className="bg-white border-top">
                                        <div className="p-3 ps-5">
                                            <Row className="g-3">
                                                <Col xs={6} md={3}>
                                                    <div className="small text-muted text-uppercase fw-bold mb-1">Duration</div>
                                                    <div className="fw-semibold text-dark">
                                                        <i className="fa-regular fa-calendar me-2" style={{ color: "var(--primary-color)" }}></i>
                                                        {plan.duration_days} Days
                                                    </div>
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <div className="small text-muted text-uppercase fw-bold mb-1">Book Limit</div>
                                                    <div className="fw-semibold text-dark">
                                                        <i className="fa-solid fa-book-open me-2" style={{ color: "var(--primary-color)" }}></i>
                                                        {plan.allowed_books} Books
                                                    </div>
                                                </Col>

                                                <Col xs={6} md={3}>
                                                    <div className="small text-muted text-uppercase fw-bold mb-1">Source</div>
                                                    <Badge bg="light" text="dark" className="border fw-normal">
                                                        {plan.source === 'Profile' ? 'Member Profile' : 'System Record'}
                                                    </Badge>
                                                </Col>
                                            </Row>
                                            {active && (
                                                <div className="mt-3 pt-2 border-top">
                                                    <small className="text-muted">
                                                        <i className="fa-solid fa-info-circle me-1"></i>
                                                        This plan is currently active.
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Collapse>
                            </Card>
                        );
                    })}
                </div>
            ) : (<></>)}
        </div>
    );
};

export default RelatedTabContent;