import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Badge, Button, Form, Spinner, ProgressBar } from "react-bootstrap";
import DataApi from "../../api/dataApi";

const RelatedTabContent = ({ id, data, refresh }) => {
   
    const [relatedPlans, setRelatedPlans] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [allPlans, setAllPlans] = useState([]); 

    const [isAddingPlan, setIsAddingPlan] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [assigningPlan, setAssigningPlan] = useState(false);

    useEffect(() => {
        if (id) fetchRelatedData();
    }, [id, data]);

    useEffect(() => {
        if (refresh > 0) fetchRelatedData();
    }, [refresh]);

    useEffect(()=>{
        fetchPlansOnly();
    }, [])
   
    const fetchPlansOnly = async () => {
        try {
            const api = new DataApi('plans');
            const plansResponse = await api.fetchAll();
            let plansArray = [];
            if (plansResponse?.data?.data) plansArray = plansResponse.data.data;
            else if (Array.isArray(plansResponse?.data)) plansArray = plansResponse.data;
            setAllPlans(plansArray);
            return plansArray;
        } catch (error) {
            console.error("Error refreshing plans:", error);
            return [];
        }
    };

    const fetchRelatedData = async () => {
        setLoadingRelated(true);
        try {
            const plansArray = await fetchPlansOnly();

            const subApi = new DataApi('subscriptions');
            const subResponse = await subApi.fetchAll();
            let subscriptionsData = [];
            if (subResponse?.data?.data) subscriptionsData = subResponse.data.data;
            else if (Array.isArray(subResponse?.data)) subscriptionsData = subResponse.data;

            let memberSubscriptions = subscriptionsData.filter(sub =>
                String(sub.member_id) === String(id) ||
                String(sub.card_id) === String(id) ||
                String(sub.library_card_id) === String(id) ||
                (data?.user_id && String(sub.user_id) === String(data.user_id))
            );

            let finalPlansList = memberSubscriptions.map(subscription => {
                const planDetails = plansArray.find(p => String(p.id) === String(subscription.plan_id));
                const basePlan = planDetails || {};

                return {
                    ...basePlan,
                    ...subscription,
                    duration_days: subscription.duration_days || basePlan.duration_days,
                    allowed_books: subscription.allowed_books || basePlan.allowed_books,
                    assigned_date: subscription.start_date || subscription.assigned_date,
                    expiry_date: subscription.end_date || subscription.expiry_date,
                    unique_key: `sub-${subscription.id}`,
                };
            });

            finalPlansList.sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));
            setRelatedPlans(finalPlansList);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const handleOpenAddPlan = async () => {
        setIsAddingPlan(true);
        await fetchPlansOnly(); 
    };

    const handleAssignPlan = async () => {
        if (!selectedPlanId) return;
        setAssigningPlan(true);
        try {
            const selectedPlan = allPlans.find(p => String(p.id) === String(selectedPlanId));
            
            const startDate = new Date();
            const endDate = new Date();
            const freshDuration = parseInt(selectedPlan.duration_days) || 30; 
            
            endDate.setDate(startDate.getDate() + freshDuration);

            const subscriptionData = {
                plan_id: selectedPlanId,
                member_id: id,
                card_id: id,
                user_id: data?.user_id || data?.id,
                plan_name: selectedPlan.plan_name || selectedPlan.name,
                duration_days: freshDuration, 
                allowed_books: selectedPlan.allowed_books,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                is_active: true,
                status: "active"
            };

            const api = new DataApi('subscriptions');
            const response = await api.create(subscriptionData);

            if (response?.data?.success || response?.status === 200 || response?.status === 201) {
                setIsAddingPlan(false);
                setSelectedPlanId("");
                await fetchRelatedData(); 
            } else {
                alert("Failed to assign. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error assigning plan");
        } finally {
            setAssigningPlan(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const isPlanActive = (plan) => {
        if (!plan || !plan.expiry_date) return false;
        const expiry = new Date(plan.expiry_date);
        expiry.setHours(23, 59, 59); 
        return expiry >= new Date(); 
    };

    const getDaysRemaining = (expiryDate) => {
        if(!expiryDate) return 0;
        const total = Date.parse(expiryDate) - Date.parse(new Date());
        const days = Math.ceil(total / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const calculateTotalDuration = (start, end) => {
        if(!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const previewPlan = useMemo(() => {
        return allPlans.find(p => String(p.id) === String(selectedPlanId));
    }, [selectedPlanId, allPlans]);

    const activePlan = relatedPlans.find(p => isPlanActive(p));
    const historyPlans = relatedPlans.filter(p => !isPlanActive(p));

    return (
        <div className="container-fluid px-0 mt-3 font-sans">
            <Row className="g-4">
                <Col lg={7}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold small m-0 text-secondary text-uppercase tracking-wide">
                            {isAddingPlan ? "Setup Subscription" : "Wallet Pass"}
                        </h6>
                    </div>

                    {!isAddingPlan && activePlan && (
                        <div 
                            className="rounded-4 p-4 text-white position-relative overflow-hidden shadow"
                            style={{ 
                                background: 'radial-gradient(circle at 100% 0%, #565e6eff 0%, #252c3dff 100%)', 
                                minHeight: '250px'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("https://www.transparenttextures.com/patterns/hexellence.png")', opacity: 0.2 }}></div>
                            
                            <div className="position-relative z-2 h-100 d-flex flex-column justify-content-between">
                               
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="d-flex flex-column">
                                        <i className="fa-solid fa-microchip fs-2 text-white opacity-75 mb-2"></i>
                                        <small className="text-white opacity-50 small letter-spacing-2">MEMBER PASS</small>
                                    </div>
                                    <Badge bg="white" text="dark" className="px-3 py-2 fw-bold shadow-sm">ACTIVE</Badge>
                                </div>

                                <div className="mb-4">
                                    <h2 className="display-6 fw-bold mb-0 text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                        {activePlan.plan_name || activePlan.name}
                                    </h2>
                                    <div className="d-flex align-items-center gap-3 mt-2 text-white opacity-75">
                                        <span className="small"><i className="fa-solid fa-book me-1"></i> {activePlan.allowed_books} Books</span>
                                        <span className="small">|</span>
                                        <span className="small"><i className="fa-regular fa-clock me-1"></i> {activePlan.duration_days} Days</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <small className="text-white opacity-75">Expires {formatDate(activePlan.expiry_date)}</small>
                                        <small className="text-warning fw-bold">{getDaysRemaining(activePlan.expiry_date)} Days Left</small>
                                    </div>
                                    <ProgressBar 
                                        now={Math.min(100, Math.max(0, (getDaysRemaining(activePlan.expiry_date) / calculateTotalDuration(activePlan.assigned_date, activePlan.expiry_date)) * 100))}
                                        variant="warning"
                                        style={{ height: '4px', background: 'rgba(255,255,255,0.2)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. VIEW: EMPTY STATE */}
                    {!isAddingPlan && !activePlan && (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 rounded-4 border border-2 border-dashed" style={{ backgroundColor: '#f8f9fa' }}>
                            <div className="text-muted opacity-25 mb-3">
                                <i className="fa-regular fa-credit-card fa-4x"></i>
                            </div>
                            <h5 className="fw-bold text-dark">No Active Pass</h5>
                            <p className="text-muted small mb-4">Assign a subscription plan to generate a member pass.</p>
                            <Button 
                                variant="dark" 
                                className="px-4 py-2 rounded-pill fw-bold shadow"
                                onClick={handleOpenAddPlan}
                            >
                                <i className="fa-solid fa-plus me-2"></i> Assign Plan
                            </Button>
                        </div>
                    )}

                    {isAddingPlan && (
                        <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold m-0 text-dark">New Subscription</h6>
                                <Button variant="light" className="rounded-circle p-2 lh-1" onClick={() => setIsAddingPlan(false)}>
                                    <i className="fa-solid fa-times"></i>
                                </Button>
                            </div>
                            <Card.Body className="p-4">
                                <Form.Label className="small fw-bold text-muted mb-2">SELECT PLAN</Form.Label>
                                <Form.Select 
                                    className="p-3 border shadow-sm rounded-3 mb-4 fw-bold text-dark"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    <option value="">-- Choose a tier --</option>
                                    {allPlans.filter(p => p.is_active !== false).map(p => (
                                        <option key={p.id} value={p.id}>{p.plan_name || p.name}</option>
                                    ))}
                                </Form.Select>

                                {previewPlan ? (
                                    <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4" style={{ backgroundColor: '#f1f5f9' }}>
                                        <div className="rounded-3 d-flex align-items-center justify-content-center bg-white shadow-sm text-dark fw-bold fs-4" style={{ width: 60, height: 60 }}>
                                            {previewPlan.duration_days}d
                                        </div>
                                        <div>
                                            <h6 className="fw-bold m-0 text-dark">{previewPlan.plan_name || previewPlan.name}</h6>
                                            <small className="text-muted">{previewPlan.allowed_books} Book Limit • Full Access</small>
                                        </div>
                                        <div className="ms-auto">
                                            <i className="fa-solid fa-circle-check text-success fs-4"></i>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 mb-4 text-center rounded-3 bg-light border border-dashed text-muted small">
                                        Select a plan to preview
                                    </div>
                                )}

                               <Button 
                                    className="w-100 py-3 rounded-3 fw-bold shadow-sm text-white "
                                    onClick={handleAssignPlan}
                                    disabled={!selectedPlanId || assigningPlan}
                                    style={{ 
                                        backgroundColor: "var(--primary-color, #6f42c1)", 
                                        borderColor: "var(--primary-color, #6f42c1)"      
                                    }}
                                >
                                    {assigningPlan ? <Spinner size="sm" animation="border" /> : "Confirm & Activate"}
                                </Button>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col lg={5}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                         <h6 className="fw-bold small m-0 text-secondary text-uppercase tracking-wide">Activity Log</h6>
                    </div>
                    
                    <div className="p-4 bg-white rounded-4 shadow-sm border" style={{ minHeight: '250px' }}>
                        {historyPlans.length > 0 ? (
                            <div className="position-relative ps-3">
                                {/* Vertical Timeline Line */}
                                <div style={{ position: 'absolute', left: '0', top: '10px', bottom: '10px', width: '2px', background: '#e9ecef' }}></div>
                                
                                {historyPlans.map((plan, i) => (
                                    <div key={plan.unique_key} className="position-relative ps-4 mb-4">
                                        {/* Dot */}
                                        <div 
                                            className="rounded-circle bg-white border border-2 border-secondary position-absolute"
                                            style={{ width: '12px', height: '12px', left: '-5px', top: '5px' }}
                                        ></div>

                                        <div className="d-flex justify-content-between align-items-start">
                                            <h6 className="fw-bold text-dark m-0">{plan.plan_name || plan.name}</h6>
                                            <small className="text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>Expired</small>
                                        </div>
                                        <div className="small text-muted mt-1">
                                            {formatDate(plan.assigned_date)} <i className="fa-solid fa-arrow-right mx-1 small"></i> {formatDate(plan.expiry_date)}
                                        </div>
                                        <div className="mt-2">
                                            <Badge bg="light" text="dark" className="border fw-normal me-1">{plan.allowed_books} Books</Badge>
                                            <Badge bg="light" text="dark" className="border fw-normal">{calculateTotalDuration(plan.assigned_date, plan.expiry_date)} Days</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <p className="text-muted small m-0">No history available.</p>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default RelatedTabContent;