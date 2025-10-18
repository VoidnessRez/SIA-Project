import React from 'react';
import './AdminAuthModal.css';

const AdminAuthModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLogin = () => {
    // TODO: Navigate to admin login page or open login form
    alert('Admin Login functionality - To be implemented');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'admin-auth-overlay') {
      onClose();
    }
  };

  return (
    <div className="admin-auth-overlay" onClick={handleOverlayClick}>
      <div className="admin-auth-modal">
        <button className="admin-auth-close" onClick={onClose}>
          ×
        </button>
        
        <div className="admin-auth-content">
          <div className="admin-auth-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2>Hello Admin!</h2>
          <p>Please login to manage inventory</p>
          
          <div className="admin-auth-actions">
            <button className="admin-auth-btn admin-auth-login" onClick={handleLogin}>
              Login
            </button>
            <button className="admin-auth-btn admin-auth-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
