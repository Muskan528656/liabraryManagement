// /**
//  * @author      Shivani Mehra
//  * @date        Sep, 2024
//  * @copyright   www.ibirdsservices.com
//  */

// import React, { useState, useEffect } from "react";
// import { Col, Form, Modal, Row } from "react-bootstrap";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import WhatsAppAPI from "../../api/WhatsAppAPI";
// import PubSub from "pubsub-js";
// const AddModuleModal = (props) => {
//   const [body, setBody] = useState([]);
//   const [rowRecord, setRowRecord] = useState(
//     props?.rowData
//       ? props?.rowData
//       : {
//           id: "",
//           name: "",
//           status: "active",
//           icon: "",
//           url: "",
//           icon_type: "className",
//           order_no: "",
//         }
//   );

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setRowRecord({ ...rowRecord, [name]: value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const isValid = rowRecord.name && rowRecord.status;
//     if (!isValid) {
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Validation Error",
//         message: "Required fields are missing."
//       });
//       return;
//     }

//     try {
//       const result = rowRecord.id
//         ? await WhatsAppAPI.updateModuleRecord(rowRecord)
//         : await WhatsAppAPI.insertModuleRecord(rowRecord);

//       if (result.success) {
//         PubSub.publish("RECORD_SAVED_TOAST", {
//           title: "Success",
//           message: rowRecord.id
//             ? "Record updated successfully."
//             : "Record created successfully."
//         });
//         props.onRefreshData();
//       } else {
//         PubSub.publish("RECORD_ERROR_TOAST", {
//           title: "Save Error",
//           message: result.message || "Failed to save record."
//         });
//       }
//     } catch (error) {
//       console.error("Error during save operation", error);
//       PubSub.publish("RECORD_ERROR_TOAST", {
//         title: "Save Error",
//         message: "An unexpected error occurred while saving the record."
//       });
//     }
//   };

//   const isFormValid =
//     rowRecord.name &&
//     rowRecord.status &&
//     rowRecord.icon &&
//     rowRecord.icon_type &&
//     rowRecord.order_no &&
//     rowRecord.url;

//     useEffect(() => {
//         const fetchData = async () => {
//           const result = await WhatsAppAPI.getModuleData();
//           if (result.success) {
//             const filteredData = result.records.filter(item => item.parent_module === null);
//             setBody(filteredData);
//           } else {
//             setBody([]);
//           }
//         };
      
//         fetchData();
//       }, [props]);
      

//   return (
//     <>
//       <Modal    backdrop="static"  show={props.show} animation={false} size="lg" centered>
//         <Modal.Header closeButton onClick={props.onHide}>
//           <Modal.Title id="contained-modal-title-vcenter">
//             {rowRecord?.id ? "Edit Module" : "Add Module"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form noValidate>
//             <Row className="p-2">
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="">
//                   <Form.Label
//                     className="form-view-label"
//                     htmlFor="formBasicFees"
//                   >
//                     Select Parent Module
//                   </Form.Label>
//                   <Form.Select
//                     style={{ height: "36px" }}
//                     aria-label="Select Parent Module"
//                     name="parent_module"
//                     onChange={handleChange}
//                     value={rowRecord?.parent_module || ""}
//                   >
//                     <option value="">-- Select Module --</option>
//                     {body.map((item) => (
//                       <option key={item.id} value={item.id}>
//                         {item.name}
//                       </option>
//                     ))}
//                   </Form.Select>
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Row className="p-2">
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="mb-1">
//                   <Form.Label htmlFor="formType">Module Name</Form.Label>
//                   <Form.Control
//                     style={{ height: "36px" }}
//                     type="text"
//                     name="name"
//                     value={rowRecord?.name}
//                     placeholder="Enter module name"
//                     onChange={handleChange}
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="ms-3">
//                   <Form.Label
//                     className="form-view-label"
//                     htmlFor="formBasicFees"
//                   >
//                     Status
//                   </Form.Label>
//                   <Form.Select
//                     style={{ height: "36px" }}
//                     aria-label="Enter Status"
//                     name="status"
//                     onChange={handleChange}
//                     value={rowRecord?.status}
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Row className="p-2">
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="mb-1">
//                   <Form.Label htmlFor="formType">Icon</Form.Label>
//                   <Form.Control
//                     style={{ height: "36px" }}
//                     type="text"
//                     name="icon"
//                     value={rowRecord?.icon}
//                     placeholder="Enter icon name"
//                     onChange={handleChange}
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="ms-3">
//                   <Form.Label
//                     className="form-view-label"
//                     htmlFor="formBasicFees"
//                   >
//                     Icon Type
//                   </Form.Label>
//                   <Form.Select
//                     style={{ height: "36px" }}
//                     aria-label="Enter Icon Type"
//                     name="icon_type"
//                     onChange={handleChange}
//                     value={rowRecord?.icon_type}
//                   >
//                     <option value="className">Class Name</option>
//                     <option value="url">URL</option>
//                   </Form.Select>
//                 </Form.Group>
//               </Col>
//             </Row>
//             <Row className="p-2 mb-2">
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="mb-1">
//                   <Form.Label htmlFor="formType">Navigate url</Form.Label>
//                   <Form.Control
//                     style={{ height: "36px" }}
//                     type="text"
//                     value={rowRecord?.url}
//                     placeholder="Enter navigate url"
//                     onChange={handleChange}
//                     name="url"
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//               <Col lg={6} sm={12} xs={12}>
//                 <Form.Group className="ms-3">
//                   <Form.Label htmlFor="formType">Order No.</Form.Label>
//                   <Form.Control
//                     style={{ height: "36px" }}
//                     type="number"
//                     name="order_no"
//                     value={rowRecord?.order_no}
//                     placeholder="Enter order number"
//                     onChange={handleChange}
//                     required
//                   />
//                 </Form.Group>
//               </Col>
//             </Row>
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <button className="btn btn-light" onClick={props.onHide}>
//             Close
//           </button>
//           <button
//             className="btn btn-outline-primary"
//             onClick={handleSubmit}
//             disabled={!isFormValid}
//           >
//             Save
//           </button>
//         </Modal.Footer>
//       </Modal>

//       <ToastContainer />
//     </>
//   );
// };

// export default AddModuleModal;
