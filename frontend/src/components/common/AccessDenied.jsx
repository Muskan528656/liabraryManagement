import React from "react";
import { Container, Row, Col, Card, Button ,Image} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
const AccessDenied = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/"); // Redirect to the home page
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        height: '88vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
    
      <div
        style={{
          position: 'relative',
          width: '80%', 
          maxHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        
        <Image
          src="403.jpg" 
          alt="Not Found"
          fluid
          style={{
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain', 
            borderRadius: '8px',
          }}
        />

       
        <div
          style={{
            position: 'absolute',
            bottom: '13%',
            left: '44%',
            textAlign: 'center',
          }}
        >
          <Button
            variant="dark"
            size="lg"
            onClick={handleGoHome}
            style={{
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
              fontSize: '1.2rem',
            }}
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
