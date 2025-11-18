import React from "react";
import { Col, Row } from "react-bootstrap";

const Footer = () => {
  return (
    <footer
      className="p-3 w-100"
      style={{
        background: "white",
        borderTop: "1px solid #e2e8f0",
        position: "fixed",
        zIndex: 999,
        bottom: "0px",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <Row className="g-0 align-items-center">
        <Col lg={6} xs={12} className="text-center text-lg-start">
          <span style={{ color: "#6c757d", fontSize: "14px" }}>
            © {new Date().getFullYear()} Library Management System. All Rights Reserved.
          </span>
        </Col>
        <Col lg={6} xs={12} className="text-center text-lg-end mt-2 mt-lg-0">
          <div className="d-flex justify-content-center justify-content-lg-end gap-3">
            <a
              href="#"
              className="text-decoration-none"
              style={{ color: "#6f42c1" }}
              title="Facebook"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a
              href="#"
              className="text-decoration-none"
              style={{ color: "#6f42c1" }}
              title="Twitter"
            >
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a
              href="#"
              className="text-decoration-none"
              style={{ color: "#6f42c1" }}
              title="LinkedIn"
            >
              <i className="fa-brands fa-linkedin"></i>
            </a>
            <a
              href="#"
              className="text-decoration-none"
              style={{ color: "#6f42c1" }}
              title="Instagram"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
          </div>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;

