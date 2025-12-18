import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Badge, Button, Form, Spinner, Table, ProgressBar } from "react-bootstrap";
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
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

    const activePlan = relatedPlans.find(p => isPlanActive(p));
    const historyPlans = relatedPlans.filter(p => !isPlanActive(p));

    // UI Helper: Get Status Badge style
    const getStatusBadge = (plan) => {
        const isActive = isPlanActive(plan);
        return (
            <span className={`badge rounded-pill px-3 py-2 fw-normal ${isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}>
                <i className={`fa-solid ${isActive ? 'fa-circle-check' : 'fa-clock'} me-1`}></i>
                {isActive ? "Active" : "Expired"}
            </span>
        );
    };

    return (
        <div className="container-fluid px-0 mt-3 font-sans">
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                    .table-hover-custom tbody tr:hover { background-color: #f9fafb !important; }
                    .glass-effect {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                `}
            </style>

            <Row className="g-4">
                <Col lg={4} md={12}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-secondary text-uppercase small tracking-wide">
                            <i className="fa-solid fa-id-card-clip me-2"></i> Current Plan
                        </h6>
                    </div>

                    {loadingRelated ? (
                        <div className="text-center py-5 bg-white rounded-4 ">
                            <Spinner animation="border" variant="primary" size="sm" />
                            <div className="mt-2 small text-muted">Checking subscription...</div>
                        </div>
                    ) : (
                        <>
                            {isAddingPlan && (
                                <Card className="border-0 rounded-4 mb-3 animate__animated animate__fadeIn">
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="fw-bold m-0 text-dark">
                                                <i className="fa-solid fa-bolt text-warning me-2"></i>
                                                New Subscription
                                            </h6>
                                            <Button 
                                                variant="light" 
                                                size="sm"
                                                className="rounded-circle btn-close-custom"
                                                onClick={() => setIsAddingPlan(false)}
                                            >
                                                <i className="fa-solid fa-times text-muted"></i>
                                            </Button>
                                        </div>
                                                                            
                                    <div className="mb-3">
                                        <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                                            <Form.Select 
                                                className="border-0 bg-white text-dark fw-semibold py-1"
                                                style={{ fontSize: '0.95rem', boxShadow: 'none' }}
                                                value={selectedPlanId}
                                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                            >
                                                <option value="">-- Choose a Plan --</option>
                                                {allPlans.map(p => (
                                                    <option key={p.id} value={p.id}>{p.plan_name || p.name}</option>
                                                ))}
                                            </Form.Select>
                                            
                                            <Button 
                                                variant=""
                                                className="px-4 fw-bold border-0"
                                                onClick={handleAssignPlan}
                                                style={{ background: 'var(--primary-color)',color:'var(--header-highlighter-color)' }}
                                            >
                                                Activate 
                                            </Button>
                                        </div>
                                    </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {!isAddingPlan && activePlan && (
                                <div 
                                    className="rounded-4 p-4 position-relative text-white overflow-hidden "
                                    style={{ 
                                        background: 'var(--primary-color)',
                                        
                                    }}
                                >
                                   
                                    <div className="position-absolute" style={{ top: '-20px', right: '-20px', opacity: '0.1', transform: 'rotate(15deg)' }}>
                                        <i className="fa-solid fa-book-reader fa-8x"></i>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-start position-relative z-1 mb-4">
                                        <div className="glass-effect px-3 py-1 rounded-pill small fw-bold text-uppercase letter-spacing-1">
                                            Library Card
                                        </div>
                                        <div className="glass-effect rounded-circle d-flex align-items-center justify-content-center" style={{width: 40, height: 40}}>
                                            <i className="fa-solid fa-check"></i>
                                        </div>
                                    </div>

                                   <div className="mb-4 position-relative z-1">
                                        <div className="text-white-50 small text-uppercase fw-bold mb-1">
                                            Active Plan
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h4 className="fw-bold mb-0 text-white text-truncate pe-2">
                                                {activePlan.plan_name || activePlan.name}
                                            </h4>
                                            <div className="d-flex align-items-center bg-white bg-opacity-10 border border-white border-opacity-25 px-2 py-1 rounded text-white" style={{ whiteSpace: 'nowrap' }}>
                                                <i className="fa-solid fa-book-open text-warning me-2" style={{ fontSize: '12px' }}></i>
                                                <span className="fw-bold small">{activePlan.allowed_books} Books</span>
                                            </div>
                                        </div>
                                        <div className="d-inline-flex align-items-center bg-white text-primary px-3 py-1 rounded-pill shadow-sm small fw-bold">
                                            <i className="fa-solid fa-hourglass-half me-2"></i>
                                            <span>{getDaysRemaining(activePlan.expiry_date)} days remaining</span>
                                        </div>

                                    </div>

                                    <div className="d-flex justify-content-between border-top border-white border-opacity-25 pt-3 mt-1 position-relative z-1">
                                        <div>
                                            <small className="text-white-50 d-block text-uppercase" style={{fontSize: '10px', letterSpacing: '1px'}}>Started</small>
                                            <span className="fw-bold">{formatDate(activePlan.assigned_date)}</span>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-white-50 d-block text-uppercase" style={{fontSize: '10px', letterSpacing: '1px'}}>Expires</small>
                                            <span className="fw-bold">{formatDate(activePlan.expiry_date)}</span>
                                        </div>
                                    </div>
                                </div>

                                // <div className="card shadow-sm border rounded-4 overflow-hidden" style={{height:'290px'}}>
                                // <div className="card-body p-4">
                                //     {/* Header: Plan Name & Status */}
                                //     <div className="d-flex justify-content-between align-items-start mb-3">
                                //         <div>
                                //             <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.75rem'}}>Current Subscription</small>
                                //             <h4 className="fw-bold text-dark mb-0 mt-1">{activePlan.plan_name || activePlan.name}</h4>
                                //         </div>
                                //         <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill border border-success border-opacity-25">
                                //             Active
                                //         </span>
                                //     </div>

                                //     {/* Middle: Time Remaining Visual */}
                                //     <div className="p-3 bg-light rounded-3 mb-4 border">
                                //         <div className="d-flex justify-content-between align-items-center mb-2">
                                //             <span className="fw-bold text-dark">{getDaysRemaining(activePlan.expiry_date)} Days Left</span>
                                //             <small className="text-muted">{activePlan.allowed_books} Books Limit</small>
                                //         </div>
                                //         <ProgressBar 
                                //             now={Math.min(100, Math.max(0, (getDaysRemaining(activePlan.expiry_date) / calculateTotalDuration(activePlan.assigned_date, activePlan.expiry_date)) * 100))}
                                //             variant="primary"
                                //             style={{ height: '6px' }}
                                //             className="mb-0"
                                //         />
                                //     </div>

                                //     {/* Footer: Dates */}
                                //     <div className="row g-0">
                                //         <div className="col-6 border-end pe-3">
                                //             <small className="text-muted d-block" style={{fontSize: '11px'}}>START DATE</small>
                                //             <span className="fw-semibold text-dark small">{formatDate(activePlan.assigned_date)}</span>
                                //         </div>
                                //         <div className="col-6 ps-3">
                                //             <small className="text-muted d-block" style={{fontSize: '11px'}}>EXPIRY DATE</small>
                                //             <span className="fw-semibold text-dark small">{formatDate(activePlan.expiry_date)}</span>
                                //         </div>
                                //     </div>
                                // </div>
                                // </div>
                            )}

                            {!isAddingPlan && !activePlan && (
                                <Card className="border-2 border-dashed border-light bg-light rounded-4 text-center h-75">
                                    <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
                                        <div className="bg-white p-3 rounded-circle shadow-sm mb-3 text-secondary">
                                            <i className="fa-solid fa-box-archive fa-2x opacity-50"></i>
                                        </div>
                                        <h6 className="text-dark fw-bold mb-1">No Active Plan</h6>
                                        <p className="text-muted small mb-4 px-3">
                                            This member currently has no active subscription. Assign a plan to grant access.
                                        </p>
                                        
                                        <Button 
                                            variant="dark" 
                                            className="fw-bold shadow-sm rounded-pill px-4" 
                                            onClick={handleOpenAddPlan}
                                        >
                                            <i className="fa-solid fa-plus me-2"></i> Assign Plan
                                        </Button>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Col>

                <Col lg={8} md={12}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-secondary text-uppercase small tracking-wide">
                            <i className="fa-solid fa-clock-rotate-left me-2"></i> Subscription History
                        </h6>
                    </div>
                    
                    <Card className="border-0 rounded-4 overflow-hidden bg-white " style={{height:"280px"}}>
                        <Card.Body className="p-0">
                            <div className="custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto'  }}>
                                <Table hover responsive className="mb-0 align-middle table-hover-custom text-nowrap" >
                                    <thead className="bg-light text-secondary table-header-bg"  style={{
                                            background: 'var(--primary-background-color)', 
                                            position: 'sticky', 
                                            top: 0,             
                                            zIndex: 10         
                                        }} >
                                        <tr> 
                                            <th className="py-3 ps-4 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600 ,background:'var(--primary-background-color)' }}>Plan Details</th>
                                            <th className="py-3 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600, background:'var(--primary-background-color)' }}>Duration</th>
                                            <th className="py-3 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600,background:'var(--primary-background-color)'  }}>Book Limit</th>
                                            <th className="py-3 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600,background:'var(--primary-background-color)'  }}>Issued Date</th>
                                            <th className="py-3 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600,background:'var(--primary-background-color)'  }}>Expired Date</th>
                                            <th className="py-3 text-end px-4 border-bottom-1 small text-uppercase text-muted" style={{ fontWeight: 600,background:'var(--primary-background-color)'  }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingRelated ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <Spinner animation="border" size="sm" variant="primary" />
                                                </td>
                                            </tr>
                                        ) : historyPlans.length > 0 ? (
                                            historyPlans.map((plan, i) => (
                                                <tr key={plan.unique_key || i} className="border-bottom border-light">
                                                    <td className="ps-4 py-3">
                                                        <div className="fw-bold text-dark">{plan.plan_name || plan.name}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="badge bg-light text-dark border fw-normal px-2">
                                                            {calculateTotalDuration(plan.expiry_date)} Days
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-muted small">
                                                        <i className="fa-solid fa-book me-1 opacity-50"></i> {plan.allowed_books}
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex flex-column small">
                                                            <span className="text-dark">{formatDate(plan.assigned_date)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex flex-column small">
                                                            <span className="text-dark">{formatDate(plan.expiry_date)}</span>
                                                        </div>
                                                    </td>
                                                   
                                                    <td className="py-3 text-end">
                                                        {getStatusBadge(plan)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" style={{border:'none'}} className="text-center py-5">
                                                    <div className="text-muted opacity-50 mb-2">
                                                        <i className="fa-regular fa-folder-open fa-2x"></i>
                                                    </div>
                                                    <div className="small text-muted">No history found</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default RelatedTabContent;