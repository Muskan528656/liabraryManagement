import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ModuleDetail from "../common/ModuleDetail";
import DataApi from "../../api/dataApi";
import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import PubSub from "pubsub-js";
import JsBarcode from "jsbarcode";

const LibraryCardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cardData, setCardData] = useState(null);
  const [issuedCount, setIssuedCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCardData();
  }, [id]);

  const fetchCardData = async () => {
    try {
      const api = new DataApi("librarycard");
      const response = await api.fetchById(id);
      if (response && response.data) {
        const card = response.data;
        setCardData(card);
        // Fetch book counts after getting card data (need user_id)
        if (card.user_id) {
          await fetchBookCounts(card.user_id, id);
        }
      }
    } catch (error) {
      console.error("Error fetching library card:", error);
      PubSub.publish("RECORD_ERROR_TOAST", {
        title: "Error",
        message: "Failed to fetch library card details",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookCounts = async (userId, cardId) => {
    try {
      // Fetch issued books count - filter by user_id or card_id
      const issueApi = new DataApi("bookissue");
      const issuesResponse = await issueApi.fetchAll();
      if (issuesResponse && issuesResponse.data) {
        const issues = Array.isArray(issuesResponse.data) 
          ? issuesResponse.data 
          : (issuesResponse.data.data || []);
        
        // Filter by user_id or card_id, and not returned
        const cardIssues = issues.filter(issue => {
          const matchesCard = issue.card_id === cardId || 
                             issue.library_card_id === cardId ||
                             issue.cardId === cardId;
          const matchesUser = issue.issued_to === userId || 
                             issue.user_id === userId ||
                             issue.student_id === userId;
          const isActive = !issue.return_date && 
                          issue.status !== 'returned' &&
                          issue.status !== 'submitted';
          
          return (matchesCard || matchesUser) && isActive;
        });
        setIssuedCount(cardIssues.length);
      }

      // Fetch submitted books count
      const submissionApi = new DataApi("book_submissions");
      const submissionsResponse = await submissionApi.fetchAll();
      if (submissionsResponse && submissionsResponse.data) {
        const submissions = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : (submissionsResponse.data.data || []);
        
        // Filter by user_id or card_id
        const cardSubmissions = submissions.filter(submission => {
          const matchesCard = submission.card_id === cardId || 
                             submission.library_card_id === cardId;
          const matchesUser = submission.issued_to === userId ||
                             submission.user_id === userId ||
                             submission.student_id === userId;
          return matchesCard || matchesUser;
        });
        setSubmittedCount(cardSubmissions.length);
      }
    } catch (error) {
      console.error("Error fetching book counts:", error);
    }
  };

  const fields = {
    title: "card_number",
    subtitle: "user_email",
    overview: [
      { key: "card_number", label: "Card Number", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "user_email", label: "Email", type: "text" },
    ],
    details: [
      { key: "card_number", label: "Card Number", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "user_email", label: "Email", type: "text" },
      { key: "issue_date", label: "Issue Date", type: "date" },
      { key: "expiry_date", label: "Submission Date", type: "date" },
      { 
        key: "is_active", 
        label: "Status", 
        type: "badge",
        badgeConfig: {
          true: "success",
          false: "secondary",
          true_label: "Active",
          false_label: "Inactive"
        }
      },
    ]
  };

  const [showBack, setShowBack] = useState(false);
  const frontBarcodeRef = useRef(null);
  const backBarcodeRef = useRef(null);

  useEffect(() => {
    if (cardData && frontBarcodeRef.current) {
      const cardNumber = cardData.card_number || cardData.id;
      try {
        JsBarcode(frontBarcodeRef.current, cardNumber, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          text: cardNumber,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Error generating front barcode:", error);
      }
    }
    if (cardData && backBarcodeRef.current) {
      const cardNumber = cardData.card_number || cardData.id;
      try {
        JsBarcode(backBarcodeRef.current, cardNumber, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          text: cardNumber,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Error generating back barcode:", error);
      }
    }
  }, [cardData, showBack]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return 'Invalid Date';
    }
  };

  const customSections = [
    {
      title: "ID Card Preview",
      colSize: 12,
      render: (data) => (
        <div>
          <div className="text-center mb-3">
            <Button
              variant={!showBack ? "primary" : "outline-primary"}
              className="me-2"
              onClick={() => setShowBack(false)}
            >
              <i className="fa-solid fa-id-card me-2"></i>
              Front View
            </Button>
            <Button
              variant={showBack ? "primary" : "outline-primary"}
              onClick={() => setShowBack(true)}
            >
              <i className="fa-solid fa-id-card me-2"></i>
              Back View
            </Button>
          </div>

          {!showBack ? (
            // Front Card View
            <Card style={{
              maxWidth: '400px',
              margin: '0 auto',
              border: '2px solid #6f42c1',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)',
                color: 'white',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0, fontWeight: 'bold' }}>LIBRARY CARD</h4>
              </div>
              <Card.Body style={{ padding: '20px' }}>
                <div className="text-center mb-3">
                  {data.image || data.user_image ? (
                    <img
                      src={data.image || data.user_image}
                      alt={data.user_name || 'User'}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid #6f42c1',
                        marginBottom: '10px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      margin: '0 auto 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '4px solid #6f42c1'
                    }}>
                      <i className="fa-solid fa-user" style={{ fontSize: '48px', color: '#6f42c1' }}></i>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h5 style={{ margin: '5px 0', color: '#6f42c1', fontWeight: 'bold' }}>
                    {data.user_name || 'N/A'}
                  </h5>
                  <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '14px' }}>
                    {data.user_email || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#6c757d', fontSize: '12px' }}>
                    Card: {data.card_number || 'N/A'}
                  </p>
                </div>

                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '15px',
                  background: '#f8f9fa',
                  marginTop: '15px'
                }}>
                  <svg ref={frontBarcodeRef} style={{ width: '100%', height: '60px' }}></svg>
                </div>

                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#6c757d',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Issue Date:</strong> {formatDate(data.issue_date)}
                  </p>
                  {data.expiry_date && (
                    <p style={{ margin: '5px 0' }}>
                      <strong>Submission Date:</strong> {formatDate(data.expiry_date)}
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          ) : (
            // Back Card View
            <Card style={{
              maxWidth: '400px',
              margin: '0 auto',
              border: '2px solid #6f42c1',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%)',
                color: 'white',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: 0, fontWeight: 'bold' }}>LIBRARY CARD</h4>
              </div>
              <Card.Body style={{ padding: '20px' }}>
                <div style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '15px',
                  background: '#f8f9fa',
                  marginBottom: '15px'
                }}>
                  <svg ref={backBarcodeRef} style={{ width: '100%', height: '60px' }}></svg>
                </div>

                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  <h6 style={{ color: '#6f42c1', marginBottom: '10px', fontWeight: 'bold' }}>
                    Card Information
                  </h6>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Card Number:</strong> {data.card_number || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Member Name:</strong> {data.user_name || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Email:</strong> {data.user_email || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Issue Date:</strong> {formatDate(data.issue_date)}
                  </p>
                  {data.expiry_date && (
                    <p style={{ margin: '5px 0' }}>
                      <strong>Submission Date:</strong> {formatDate(data.expiry_date)}
                    </p>
                  )}
                  <p style={{ margin: '5px 0' }}>
                    <strong>Status:</strong>{' '}
                    <Badge bg={data.is_active ? "success" : "secondary"}>
                      {data.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>

                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#fff3cd',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#856404',
                  textAlign: 'center',
                  border: '1px solid #ffc107'
                }}>
                  <p style={{ margin: 0 }}>
                    <i className="fa-solid fa-info-circle me-1"></i>
                    Scan barcode to verify membership
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )
    },
    {
      title: "Book Statistics",
      colSize: 12,
      render: (data) => (
        <Row className="mt-3">
          <Col md={6}>
            <Card className="text-center" style={{ border: "2px solid #28a745" }}>
              <Card.Body>
                <h3 style={{ color: "#28a745", margin: 0 }}>{issuedCount}</h3>
                <p className="text-muted mb-0">Books Issued</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center" style={{ border: "2px solid #17a2b8" }}>
              <Card.Body>
                <h3 style={{ color: "#17a2b8", margin: 0 }}>{submittedCount}</h3>
                <p className="text-muted mb-0">Books Submitted</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <ModuleDetail
      moduleName="librarycards"
      moduleApi="librarycard"
      moduleLabel="Library Card"
      fields={fields}
      customSections={customSections}
    />
  );
};

export default LibraryCardDetail;
