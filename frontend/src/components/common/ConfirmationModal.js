import React from "react";
import { Button, Modal } from "react-bootstrap";

const ConfirmationModal = ({ show, onHide, onConfirm, title = "Confirm", message = "Are you sure?", confirmText = "Yes", cancelText = "Cancel" }) => {
  return (

    <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
              <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{message}</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} >
                Delete
              </Button>
            </Modal.Footer>
          </Modal>
  );
};

export default ConfirmationModal;
