// import React from "react";
// import { Alert, } from "react-bootstrap";

// const Notification = ({ closeNotification, notifications }) => {

//   const closeParent = (msgId) => {
//     closeNotification(msgId);
//   };

//   return (
//     <div className="notification-area">
//       {notifications?.length > 0 && notifications?.map((item) => (
//         <Alert style={{ width: "400px" }} variant="success" onClose={() => closeParent(item.id)} dismissible>
//           <Alert.Heading><div className="d-flex align-items-center justify-content-between">
//             <div
//               style={{
//                 fontSize: "smaller",
//                 borderBottom: "1px solid #17191c33",
//                 paddingBottom: ".2rem",
//                 marginBottom: ".5rem",
//               }}
//             >
//               <span
//                 className="d-inline"
//                 style={{
//                   border: "none",
//                   color: "#e6e6e6",
//                   fontSize: "1rem",
//                   color: "#645721",
//                 }}
//               >
//                 {item.createdbyname}
//               </span>
//               <span
//                 className="d-inline"
//                 style={{
//                   paddingLeft: "1rem",
//                   color: "#645721",
//                   fontSize: ".8rem",
//                   border: "none",
//                 }}
//               >
//                 {item.date}
//               </span>
//             </div>
//           </div>
//           </Alert.Heading>
//           <p dangerouslySetInnerHTML={{ __html: item.description }} />

//         </Alert>
//       ))}
//     </div>
//   )
// }
// export default Notification;
