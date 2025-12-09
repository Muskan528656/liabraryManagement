
import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Alert, Button } from 'react-bootstrap';
import DataApi from '../../api/dataApi';

const PlanDetailsTab = ({ libraryCardId }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (libraryCardId) {
            fetchPlansForCard(libraryCardId);
        } else {
            setPlans([]);
            setLoading(false);
        }
    }, [libraryCardId]);

    const fetchPlansForCard = async (cardId) => {
        try {
            setLoading(true);
            setError(null);


            const cardApi = new DataApi("librarycard");
            const cardResponse = await cardApi.fetchById(cardId);

            if (!cardResponse.data) {
                setPlans([]);
                setLoading(false);
                return;
            }

            const cardData = cardResponse.data;
            const assignedPlans = [];


            if (cardData.subscription_id) {

                const subscriptionApi = new DataApi("subscriptions");
                const subscriptionResponse = await subscriptionApi.fetchById(cardData.subscription_id);

                if (subscriptionResponse.data) {
                    const subscription = subscriptionResponse.data;
                    assignedPlans.push({
                        id: subscription.id,
                        plan_name: subscription.plan_name,
                        duration_days: subscription.duration_days,
                        allowed_books: subscription.allowed_books,
                        is_active: subscription.is_active,
                        start_date: subscription.start_date,
                        end_date: subscription.end_date,
                        price: subscription.price,
                        currency: subscription.currency,
                        type: 'Subscription'
                    });
                }
            }


            if (cardData.plan_id) {

                const plansApi = new DataApi("plan");
                const planResponse = await plansApi.fetchById(cardData.plan_id);

                if (planResponse.data) {
                    const plan = planResponse.data;


                    const existingPlanIndex = assignedPlans.findIndex(p => p.id === plan.id);

                    if (existingPlanIndex === -1) {
                        assignedPlans.push({
                            id: plan.id,
                            plan_name: plan.plan_name,
                            duration_days: plan.duration_days,
                            allowed_books: plan.allowed_books,
                            is_active: plan.is_active,
                            start_date: plan.start_date || cardData.issue_date,
                            end_date: plan.end_date,
                            price: plan.price,
                            currency: plan.currency,
                            type: 'Plan'
                        });
                    }
                }
            }


            const plansWithRemainingDays = assignedPlans.map(plan => {
                let remainingDays = null;
                let status = 'unknown';

                if (plan.end_date) {
                    const today = new Date();
                    const expiryDate = new Date(plan.end_date);
                    const diffTime = expiryDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    remainingDays = diffDays;

                    if (diffDays < 0) {
                        status = 'expired';
                    } else if (diffDays <= 7) {
                        status = 'expiring_soon';
                    } else {
                        status = 'active';
                    }
                } else if (plan.start_date && plan.duration_days) {
                    const startDate = new Date(plan.start_date);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + parseInt(plan.duration_days));

                    const today = new Date();
                    const diffTime = endDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    remainingDays = diffDays;

                    if (diffDays < 0) {
                        status = 'expired';
                    } else if (diffDays <= 7) {
                        status = 'expiring_soon';
                    } else {
                        status = 'active';
                    }
                }

                return {
                    ...plan,
                    remaining_days: remainingDays,
                    status: status
                };
            });

            setPlans(plansWithRemainingDays);
        } catch (err) {
            console.error("Error fetching plans:", err);
            setError("Failed to load plan details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const getStatusBadge = (plan) => {
        if (!plan.is_active) {
            return <Badge bg="danger">INACTIVE</Badge>;
        }

        if (plan.status === 'expired') {
            return <Badge bg="danger">EXPIRED</Badge>;
        } else if (plan.status === 'expiring_soon') {
            return <Badge bg="warning" text="dark">EXPIRING SOON</Badge>;
        } else if (plan.status === 'active') {
            return <Badge bg="success">ACTIVE</Badge>;
        } else {
            return <Badge bg="secondary">UNKNOWN</Badge>;
        }
    };

    const getRemainingDaysText = (plan) => {
        if (plan.remaining_days === null) return "N/A";

        if (plan.remaining_days < 0) {
            return `${Math.abs(plan.remaining_days)} days ago`;
        } else {
            return `${plan.remaining_days} days`;
        }
    };

    if (!libraryCardId) {
        return (
            <Card className="border mt-3">
                <Card.Body className="text-center py-4">
                    <i className="fa-solid fa-file-invoice fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Library Card Selected</h6>
                    <p className="text-muted small mb-0">Select a library card to view assigned plans</p>
                </Card.Body>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="border mt-3">
                <Card.Body className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading plan details...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border border-danger mt-3">
                <Card.Body className="py-3">
                    <Alert variant="danger">
                        <i className="fa-solid fa-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm mt-3">
            <Card.Body className="p-0">
                <div className="p-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">Assigned Plans</h5>
                        <Badge bg="info" pill>
                            {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'}
                        </Badge>
                    </div>
                </div>

                {plans.length === 0 ? (
                    <div className="p-5 text-center">
                        <i className="fa-solid fa-calendar-times fa-3x text-muted mb-3"></i>
                        <h6 className="text-muted">No Plans Assigned</h6>
                        <p className="text-muted small">This library card has no assigned plans</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th width="40">#</th>
                                    <th>Plan Details</th>
                                    <th className="text-center">Duration</th>
                                    <th className="text-center">Books</th>
                                    <th className="text-center">Remaining Days</th>
                                    <th className="text-center">Status</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan, index) => (
                                    <tr key={plan.id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>
                                            <div className="fw-bold">{plan.plan_name}</div>
                                            <div className="small text-muted">
                                                {plan.start_date && (
                                                    <div>Start: {formatDate(plan.start_date)}</div>
                                                )}
                                                {plan.end_date && (
                                                    <div>End: {formatDate(plan.end_date)}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg="light" text="dark" className="px-3 py-2">
                                                {plan.duration_days || 0} days
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Badge bg="info" className="px-3 py-2">
                                                {plan.allowed_books || 0} books
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <div className={`fw-bold ${plan.remaining_days !== null && plan.remaining_days < 0 ? 'text-danger' :
                                                    plan.remaining_days !== null && plan.remaining_days <= 7 ? 'text-warning' :
                                                        plan.remaining_days !== null ? 'text-success' : 'text-muted'
                                                }`}>
                                                {getRemainingDaysText(plan)}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {getStatusBadge(plan)}
                                        </td>
                                        <td>
                                            <Badge bg={plan.type === 'Subscription' ? 'primary' : 'secondary'}>
                                                {plan.type}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* Summary Section */}
                {plans.length > 0 && (
                    <div className="p-4 border-top">
                        <Row>
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <div className="small text-muted">Total Plans</div>
                                    <div className="fw-bold h4">{plans.length}</div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <div className="small text-muted">Active Plans</div>
                                    <div className="fw-bold h4 text-success">
                                        {plans.filter(p => p.is_active && p.status === 'active').length}
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 bg-light rounded">
                                    <div className="small text-muted">Total Books Allowed</div>
                                    <div className="fw-bold h4 text-primary">
                                        {plans.reduce((sum, plan) => sum + (parseInt(plan.allowed_books) || 0), 0)}
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PlanDetailsTab;