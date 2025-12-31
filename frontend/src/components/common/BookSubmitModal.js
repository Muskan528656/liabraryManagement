import { Modal, Button } from "react-bootstrap";
import BookSubmit from "../booksubmit/BookSubmit";

const BookSubmitModal = ({ show, onHide }) => {

    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                fullscreen={true}
                backdrop="static"
                keyboard={false}
                centered={false}
            >
                <Modal.Header closeButton className="border-bottom">
                    <div className="d-flex align-items-center">
                        <i className="fa-solid fa-book-bookmark me-3" style={{ fontSize: "24px", color: "var(--primary-color)" }}></i>
                        <Modal.Title className="fw-bold" style={{ color: "#2d3748" }}>
                            Book Submission
                        </Modal.Title>
                    </div>
                </Modal.Header>

                <Modal.Body className="p-0">
                    {/* Barcode Scan Content */}
                    <div style={{ minHeight: "400px", padding: "1.5rem" }}>
                        <BookSubmit tabType="barcode" />
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-top p-3">
                    <Button
                        variant="outline-secondary"
                        onClick={onHide}
                        className="px-4"
                    >
                        <i className="fa-solid fa-times me-2"></i>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BookSubmitModal;
