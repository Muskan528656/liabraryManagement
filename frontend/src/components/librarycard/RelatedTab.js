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
        if (id) {
            fetchRelatedData();
        }
    }, [id, data]);

    useEffect(() => {
        if (refresh > 0) {
            fetchRelatedData();
        }
    }, [refresh]);

   
    useEffect(()=>{
        fetchPlansOnly();
    })
   
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
        return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
        console.log("getDaysRemaining=>", days);

        return days > 0 ? days : 0;
    };

    const calculateTotalDuration = (start, end) => {
        console.log("start => ",start ,"end => ", end)
        if(!start || !end) return 0;
        const diff = new Date(end) - new Date(start);
        console.log("diff=>",diff,"Math.ceil(diff / (1000 * 60 * 60 * 24))",Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
                        <h6 className="fw-bold small m-0 text-uppercase" style={{color: '#6c757d'}}>
                            {isAddingPlan ? "New Subscription" : "Current Subscription"}
                        </h6>
                    </div>

                    {!isAddingPlan && activePlan && (
                        <div 
                            className="position-relative overflow-hidden"
                            style={{ 
                                background: "linear-gradient(135deg, #ffffff 50%, #f3e6ff 100%)",
                                borderRadius: "20px",
                                boxShadow: "0 10px 30px rgba(111, 66, 193, 0.15)",
                                border: "1px solid rgba(255,255,255,0.8)",
                                minHeight: "260px"
                            }}
                        >
                            <div style={{
                                position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px",
                                borderRadius: "50%", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
                                opacity: "0.2", filter: "blur(40px)"
                            }}></div>

                            <div className="p-4 p-md-5 position-relative" style={{ zIndex: 1 }}>
                      
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div>
                                        <Badge className="px-3 py-2 mb-2 rounded-pill shadow-sm" 
                                               style={{ background: "linear-gradient(45deg, #6f42c1, #a059f5)", border: "none" }}>
                                            <i className="fa-solid fa-bolt me-1"></i> ACTIVE
                                        </Badge>
                                        <h2 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>
                                            {activePlan.plan_name || activePlan.name}
                                        </h2>
                                    </div>
                                    <div className="text-end">
                                        <div className="text-muted small fw-bold">EXPIRING ON</div>
                                        <div className="text-dark fw-bold fs-5">{formatDate(activePlan.expiry_date)}</div>
                                    </div>
                                </div>

                                <Row className="g-3 mb-4">
                                    <Col xs={6}>
                                        <div className="p-3 rounded-4 d-flex align-items-center h-100" 
                                             style={{ 
                                                 backgroundColor: "rgba(255, 255, 255, 0.7)", 
                                                 backdropFilter: "blur(10px)",
                                                 border: "1px solid rgba(255,255,255,0.9)",
                                                 boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
                                             }}>
                                            <div className="me-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                     style={{ width: '40px', height: '40px', background: '#f3e6ff', color: '#6f42c1' }}>
                                                    <i className="fa-solid fa-book-open"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark fs-5 lh-1">{activePlan.allowed_books}</div>
                                                <small className="text-muted" style={{fontSize: '0.75rem'}}>Book Limit</small>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={6}>
                                        <div className="p-3 rounded-4 d-flex align-items-center h-100" 
                                             style={{ 
                                                 backgroundColor: "rgba(255, 255, 255, 0.7)", 
                                                 backdropFilter: "blur(10px)",
                                                 border: "1px solid rgba(255,255,255,0.9)",
                                                 boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
                                             }}>
                                            <div className="me-3">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                     style={{ width: '40px', height: '40px', background: '#e0f7fa', color: '#00bcd4' }}>
                                                    <i className="fa-regular fa-clock"></i>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark fs-5 lh-1">
                                                    {calculateTotalDuration(activePlan.assigned_date, activePlan.expiry_date)}
                                                </div>
                                                <small className="text-muted" style={{fontSize: '0.75rem'}}>Days Validity</small>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <div>
                                    <div className="d-flex justify-content-between small mb-2 align-items-end">
                                        <span className="text-muted">Started: <strong>{formatDate(activePlan.assigned_date)}</strong></span>
                                        <span className="text-primary fw-bold">
                                            <i className="fa-solid fa-hourglass-half me-1"></i>
                                            {getDaysRemaining(activePlan.expiry_date)} days left
                                        </span>
                                    </div>
                                    
                                    <div className="progress" style={{ height: "10px", borderRadius: "10px", backgroundColor: "#e9ecef" }}>
                                        <div 
                                            className="progress-bar" 
                                            role="progressbar" 
                                            style={{ 
                                                width: `${Math.min(100, Math.max(0, (getDaysRemaining(activePlan.expiry_date) / calculateTotalDuration(activePlan.assigned_date, activePlan.expiry_date)) * 100))}%`,
                                                background: "linear-gradient(90deg, #6f42c1 0%, #00bcd4 100%)",
                                                borderRadius: "10px"
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isAddingPlan && !activePlan && (
                        <Card className="border-0 shadow-sm text-center" style={{ borderRadius: "20px", border: '2px dashed #e9ecef',height:'300px' }}>
                            <Card.Body className="p-3 d-flex flex-column align-items-center justify-content-center">
                                <div className="mb-2 p-2 rounded-circle shadow-sm" style={{ backgroundColor: '#fff', color: '#adb5bd' }}>
                                    <i className="fa-solid fa-file-circle-plus fa-3x"></i>
                                </div>
                                <h5 className="fw-bold text-dark">No Active Plan</h5>
                                <p className="text-muted small mb-4">
                                    Member has no subscription. Assign a plan to start.
                                </p>
                                <Button 
                                    onClick={handleOpenAddPlan} 
                                    className="px-5 py-2 rounded-pill fw-bold text-white shadow-sm"
                                    style={{ background: 'linear-gradient(45deg, #6f42c1, #a059f5)', border: 'none' }}
                                >
                                    <i className="fa-solid fa-plus me-1"></i> Assign Subscription
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {isAddingPlan && (
                        <Card className="border-0 shadow h-100 rounded-4 overflow-hidden bg-white">
                            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
                                <h6 className="fw-bold m-0 text-dark">
                                    <i className="fa-solid fa-layer-group me-2" style={{ color: '#6f42c1' }}></i>Select Membership
                                </h6>
                                <Button variant="light" className="btn-close" size="sm" onClick={() => setIsAddingPlan(false)}></Button>
                            </div>
                            <Card.Body className="p-4">
                                <Form.Label className="text-secondary small fw-bold text-uppercase">Available Plans</Form.Label>
                                <Form.Select 
                                    size="lg"
                                    className="mb-4 shadow-sm"
                                    style={{ borderColor: '#dee2e6', fontSize: '0.95rem' }}
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    <option value="">-- Choose a Plan --</option>
                                    {allPlans.filter(p => p.is_active !== false).map(p => (
                                        <option key={p.id} value={p.id}>{p.plan_name || p.name}</option>
                                    ))}
                                </Form.Select>

                                {previewPlan ? (
                                    <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#f3e9fc', border: '1px solid #e0cffc' }}>
                                        <div className="d-flex align-items-center mb-3">
                                            <span className="badge me-2" style={{ backgroundColor: '#6f42c1' }}>Selected</span>
                                            <strong style={{ color: '#4a2c85' }}>{previewPlan.plan_name || previewPlan.name}</strong>
                                        </div>
                                        <Row className="g-2 text-center">
                                            <Col xs={6}>
                                                <div className="bg-white p-2 rounded shadow-sm">
                                                    <div className="small text-muted text-uppercase" style={{fontSize: '0.7rem'}}>Duration</div>
                                                    <div className="fw-bold text-dark">{previewPlan.duration_days} Days</div>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="bg-white p-2 rounded shadow-sm">
                                                    <div className="small text-muted text-uppercase" style={{fontSize: '0.7rem'}}>Limit</div>
                                                    <div className="fw-bold text-dark">{previewPlan.allowed_books} Books</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 mb-4 bg-light rounded border border-dashed text-muted small">
                                        Select a plan to see details
                                    </div>
                                )}

                                <Button 
                                    className="w-100 py- fw-bold text-white shadow" 
                                    size="lg"
                                    onClick={handleAssignPlan}
                                    disabled={!selectedPlanId || assigningPlan}
                                    style={{ background: 'linear-gradient(45deg, #6f42c1, #a059f5)', border: 'none' }}
                                >
                                    {assigningPlan ? <Spinner size="sm" animation="border" /> : "Confirm & Activate"}
                                </Button>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col lg={5}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                         <h6 className="fw-bold small m-0 text-uppercase" style={{color: '#6c757d'}}>History</h6>
                    </div>
                    
                    <Card className="border-0 shadow-sm rounded-4" style={{ minHeight: '300px', backgroundColor: '#fff' }}>
                        <Card.Body className="p-0">
                            {historyPlans.length > 0 ? (
                                <div className="p-3">
                                    {historyPlans.map((plan, index) => (
                                        <div key={plan.unique_key} className="d-flex position-relative pb-4">
                                          
                                            {index !== historyPlans.length - 1 && (
                                                <div 
                                                    style={{ 
                                                        position: "absolute", left: "19px", top: "35px", bottom: "0", 
                                                        width: "2px", backgroundColor: "#f0f0f0" 
                                                    }} 
                                                />
                                            )}
                                            <div className="me-3 z-1">
                                                <div 
                                                    className="rounded-circle d-flex align-items-center justify-content-center border shadow-sm"
                                                    style={{ width: "40px", height: "40px", backgroundColor: '#fff', color: '#adb5bd' }}
                                                >
                                                    <i className="fa-solid fa-clock-rotate-left small"></i>
                                                </div>
                                            </div>
                                          
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0 fw-bold text-dark" style={{fontSize: '0.95rem'}}>
                                                        {plan.plan_name || plan.name}
                                                    </h6>
                                                    <Badge bg="light" text="dark" className="border fw-normal" style={{ fontSize: '0.65rem' }}>EXPIRED</Badge>
                                                </div>
                                                <div className="small text-muted mb-1">
                                                    {calculateTotalDuration(plan.assigned_date, plan.expiry_date)} Days · {plan.allowed_books} Books
                                                </div>
                                                <div className="small p-1 px-2 rounded d-inline-block text-secondary border" style={{ backgroundColor: '#f8f9fa' }}>
                                                    {formatDate(plan.assigned_date)} — {formatDate(plan.expiry_date)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <div className="mb-3 text-muted opacity-25">
                                        <i className="fa-regular fa-calendar-xmark fa-3x"></i>
                                    </div>
                                    <p className="text-muted small">No previous subscriptions.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default RelatedTabContent;