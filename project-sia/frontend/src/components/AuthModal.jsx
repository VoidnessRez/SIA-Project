import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, message = "You need to Sign in first :)" }) => {
  const navigate = useNavigate();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent scrollbar jump
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onClose();
    navigate('/login');
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleCancel}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-icon">🔒</div>
        <h2 className="auth-modal-title">{message}</h2>
        <p className="auth-modal-description">
          Sign in to add products to cart, view details, and make purchases.
        </p>
        
        <div className="auth-modal-buttons">
          <button className="auth-modal-btn cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="auth-modal-btn continue-btn" onClick={handleContinue}>
            Continue to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
