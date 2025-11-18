/**
 * @author      Abdul Pathan
 * @date        Sep, 2024
 * @copyright   www.ibirdsservices.com
 */

import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Col, Form, Row } from "react-bootstrap";
const Confirm = (props) => {
  const deleteAccount = () => {
    setTimeout(() => {
      props.deleteAccount();
    }, 1000);
  };

  const deleteLead = () => {
    setTimeout(() => {
      props.deleteLead();
    }, 1000);
  };

  const deleteTemplate = () => {
    setTimeout(() => {
      props.deleteTemplate();
    }, 1000);
  };

  const deleteResponceMessage = () => {
    setTimeout(() => {
      props.deleteResponseRecord();
    }, 1000);
  };

  const changeGroupStatus = () => {
    setTimeout(() => {
      props.changeGroupStatus();
    }, 1000);
  };
  const deleteGroupMember = () => {
    setTimeout(() => {
      props.deleteGroupMember();
    }, 1000);
  };

  const deleteModuleRecord = () => {
    props.deleteModuleRecord();
  };

  const deletePlanRecord = () => {
    setTimeout(() => {
      props.deletePlanRecord();
    }, 1000);
  };

  const changeStatus = () => {
    setTimeout(() => {
      props.changeStatus();
    }, 1000);
  };
  const changeModuleStatus = () => {
    setTimeout(() => {
      props.changeModuleStatus();
    }, 1000);
  };
  const changeCompanyStatus = () => {
    setTimeout(() => {
      props.changeCompanyStatus();
    }, 1000);
  };

  const handleCancelPay = () => {
    setTimeout(() => {
      props.handleCancelPay();
    }, 1000);
  };

  const deletePublicLead = () => {
    setTimeout(() => {
      props.deletePublicLead();
    }, 1000);
  };

  const deleteAddonRecord = () => {
    setTimeout(() => {
      props.deleteAddonRecord();
    }, 1000);
  };

  return (
    <Modal
      show={props.show}
      aria-labelledby="contained-modal-title-vcenter"
      centered
      size="md"
    >
      <Modal.Header closeButton onClick={props.onHide} className="">
        <Modal.Title id="contained-modal-title-vcenter">
          {props.title}
          <br />
        </Modal.Title>
      </Modal.Header>

      {!props.loading ? (
        <>
          <Modal.Body>
            <Row>
              <Col lg={12} sm={12} xs={12}>
                <Form noValidate className="mb-0">
                  <i>{props.message}</i>
                </Form>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <div className="d-flex justify-content-end">
              <button
                className="btn btn-outline-primary"
                onClick={props.onHide}
              >
                {" "}
                No{" "}
              </button>

              {props.table === "account" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteAccount}
                >
                  Yes{" "}
                </button>
              )}

              {props.table === "lead" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteLead}
                >
                  Yes{" "}
                </button>
              )}

              {props.table === "template" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteTemplate}
                >
                  Yes{" "}
                </button>
              )}

              {props.table === "response_message" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteResponceMessage}
                >
                  Yes{" "}
                </button>
              )}

              {props.table === "group" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={changeGroupStatus}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "group_member" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteGroupMember}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "deleteFlow" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteModuleRecord}
                  disabled={props.loading}
                >
                  {props.loading ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    "Yes"
                  )}
                </button>
              )}
              {props.table === "module_status" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={changeModuleStatus}
                >
                  Yes{" "}
                </button>
              )}

              {props.table === "plan" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deletePlanRecord}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "plan_status" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={changeStatus}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "company" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={changeCompanyStatus}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "cancel_invoice" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={handleCancelPay}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "web_lead" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deletePublicLead}
                >
                  Yes{" "}
                </button>
              )}
              {props.table === "addon" && (
                <button
                  className="btn btn-outline-primary mx-2"
                  onClick={deleteAddonRecord}
                >
                  Yes{" "}
                </button>
              )}
            </div>
          </Modal.Footer>
        </>
      ) : (
        <div className="sk-cube-grid">
          <div className="sk-cube sk-cube1"></div>
          <div className="sk-cube sk-cube2"></div>
          <div className="sk-cube sk-cube3"></div>
          <div className="sk-cube sk-cube4"></div>
          <div className="sk-cube sk-cube5"></div>
          <div className="sk-cube sk-cube6"></div>
          <div className="sk-cube sk-cube7"></div>
          <div className="sk-cube sk-cube8"></div>
          <div className="sk-cube sk-cube9"></div>
        </div>
      )}
    </Modal>
  );
};

export default Confirm;
