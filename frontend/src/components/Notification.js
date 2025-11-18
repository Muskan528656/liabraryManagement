import React, { useState } from 'react'
import { Alert } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';

const Notification = (props) => {
  const [notifications, setNotifications] = useState(JSON.parse(sessionStorage.getItem("notifications")));


  return (
    <>

      {notifications?.map((rec, index) => {
        return <Modal
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          show={true}
        >

          <Alert show={true} variant="danger" className='mb-0'>
            <Alert.Heading>{rec.title}</Alert.Heading>
            <p>
              {rec.description}
            </p>
            <hr />
            <p>Contact: sales@indicrm.io , +91 9521347078</p>
          </Alert>
        </Modal>

      })}
    </>
  )
}

export default Notification