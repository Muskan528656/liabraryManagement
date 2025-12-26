import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ImportDataModal = ({ show, onClose, onImport }) => {
    const [file, setFile] = useState(null);
    const [type, setType] = useState("");
    const [subType, setSubType] = useState("");

    const handleImport = () => {
        if (!type) {
            alert("Please select import type!");
            return;
        }

 
        if (["student", "parent", "staff"].includes(type) && !subType) {
            alert("Please select data to import!");
            return;
        }

        if (!file) {
            alert("Please select a file first!");
            return;
        }

 
        onImport({ type, subType, file });
        onClose();
    };

    const resetSubType = () => {
        setSubType("");
    };

    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Import Data</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Type Dropdown */}
                <Form.Group className="mb-3">
                    <Form.Label>Select Import Type</Form.Label>
                    <Form.Select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            resetSubType();
                        }}
                    >
                        <option value="">-- Select Type --</option>
                        <option value="book">Book</option>
                        <option value="author">Author</option>
                        <option value="category">Category</option>
                        <option value="publisher">Publisher</option>
                        <option value="member">Member</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="staff">Staff</option>
                    </Form.Select>
                </Form.Group>

                {/* Conditional Sub-type Dropdown for Student, Parent, Staff */}
                {["student", "parent", "staff"].includes(type) && (
                    <Form.Group className="mb-3">
                        <Form.Label>Select Data to Import</Form.Label>
                        <Form.Select
                            value={subType}
                            onChange={(e) => setSubType(e.target.value)}
                        >
                            <option value="">-- Select Data --</option>

                            {type === "student" && (
                                <>
                                    <option value="student_info">Student Information</option>
                                    <option value="student_marks">Student Marks</option>
                                    <option value="student_attendance">Student Attendance</option>
                                    <option value="student_fees">Student Fees</option>
                                    <option value="student_documents">Student Documents</option>
                                </>
                            )}

                            {type === "parent" && (
                                <>
                                    <option value="parent_info">Parent Information</option>
                                    <option value="parent_contacts">Parent Contacts</option>
                                    <option value="parent_students">Parent-Student Mapping</option>
                                </>
                            )}

                            {type === "staff" && (
                                <>
                                    <option value="staff_info">Staff Information</option>
                                    <option value="staff_salary">Staff Salary</option>
                                    <option value="staff_attendance">Staff Attendance</option>
                                    <option value="staff_qualification">Staff Qualification</option>
                                    <option value="staff_documents">Staff Documents</option>
                                </>
                            )}
                        </Form.Select>
                    </Form.Group>
                )}

                {/* File Upload */}
                <Form.Group>
                    <Form.Label>
                        Select CSV / Excel File
                        {subType && (
                            <span className="text-muted" style={{ fontSize: "0.9rem", marginLeft: "5px" }}>
                                ({subType.replace("_", " ")})
                            </span>
                        )}
                    </Form.Label>
                    <Form.Control
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <Form.Text className="text-muted">
                        {type === "student" && "Upload student-related data"}
                        {type === "parent" && "Upload parent-related data"}
                        {type === "staff" && "Upload staff-related data"}
                        {!["student", "parent", "staff"].includes(type) && "Upload your data file"}
                    </Form.Text>
                </Form.Group>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    style={{
                        background: "var(--primary-color)",
                        border: "none",
                    }}
                    onClick={handleImport}
                    disabled={!type || !file || (["student", "parent", "staff"].includes(type) && !subType)}
                >
                    Import
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ImportDataModal;