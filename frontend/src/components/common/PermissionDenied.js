// components/common/PermissionDenied.js
import React, { useState } from 'react';
import NotificationApi from '../../api/notificationApi';

const PermissionDenied = () => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleExitClick = async () => {
    setIsRequesting(true);
    try {
      const result = await NotificationApi.requestAccess();
      if (result.success) {
        alert("Access request sent to system admin. You will be redirected to login.");
      } else {
        alert("Failed to send access request. Please try again.");
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsRequesting(false);
      window.location.href = '/login';
    }
  };

  return (
    <div className="permission-overlay">
      <div className="permission-modal-card">
        {/* Close Button Icon */}
        {/* <button className="close-btn-x">&times;</button> */}

        <div className="permission-modal-body">
          {/* Badge Icon (Approximating the star badge in your image) */}
          <div className="badge-container">
            <div className="badge-icon-wrapper">
                <i className="fas fa-shield-alt main-icon"></i>
                <i className="fas fa-star star-overlay"></i>
            </div>
          </div>

          <h2 className="permission-title">Access Restricted</h2>
          <p className="permission-text">
            You don't have permission to view the dashboard details yet.
            <br />
            <span className="admin-highlight">Please contact system admin</span> 
            <br />
            to request access and start managing your library today!
          </p>

          <div className="mt-4">
            <button
              className="permission-exit-btn"
              onClick={handleExitClick}
              disabled={isRequesting}
            >
              {isRequesting ? 'Sending Request...' : 'Exit'}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .permission-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4); /* Semi-transparent grey backdrop */
          backdrop-filter: blur(4px); /* Blurs the dashboard behind it */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .permission-modal-card {
          background: white;
          width: 90%;
          max-width: 550px;
          border-radius: 28px;
          padding: 40px;
          position: relative;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          text-align: center;
        }

        .close-btn-x {
          position: absolute;
          top: 20px;
          right: 25px;
          background: none;
          border: none;
          font-size: 24px;
          color: #ccc;
          cursor: pointer;
        }

        .badge-container {
          margin-bottom: 25px;
          display: flex;
          justify-content: center;
        }

        .badge-icon-wrapper {
          position: relative;
          font-size: 80px;
          color: #e0d5c8; /* Light bronze/grey color like image */
        }

        .star-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 30px;
          color: white;
        }

        .permission-title {
          font-weight: 700;
          color: #4a4a4a;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .permission-text {
          color: #777;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .admin-highlight {
          color: #00bcd4; /* Bright cyan from your image */
          font-weight: 600;
        }

        .permission-exit-btn {
          background-color: #00bcd4;
          color: white;
          border: none;
          padding: 10px 45px;
          border-radius: 12px;
          font-weight: 600;
          transition: 0.3s;
        }

        .permission-exit-btn:hover {
          background-color: #0097a7;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default PermissionDenied;