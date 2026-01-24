import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageNotFound.css';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="page-not-found">
      <div className="not-found-container">
        <div className="error-code">404</div>
        <div className="error-icon">🔍</div>
        <h1>Page Not Found</h1>
        <p className="error-message">
          Oops! The page you're looking for doesn't exist or is currently unavailable.
        </p>
        
        <div className="not-found-info">
          <h3>🛍️ Shopee Payment Coming Soon!</h3>
          <p>
            We're working hard to integrate Shopee Pay for a more secure and convenient payment experience.
            In the meantime, please use our other available payment methods:
          </p>
          <ul className="payment-alternatives">
            <li>💵 Cash on Delivery (COD)</li>
            <li>📱 GCash Payment</li>
            <li>🏦 Bank Transfer</li>
          </ul>
        </div>

        <div className="not-found-actions">
          <button className="btn-home" onClick={() => navigate('/')}>
            🏠 Go to Homepage
          </button>
          <button className="btn-products" onClick={() => navigate('/products')}>
            🛒 Browse Products
          </button>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>

        <div className="help-section">
          <p>Need help? Contact us:</p>
          <p>📞 Phone: 09123456789</p>
          <p>📧 Email: support@mejiaspareparts.com</p>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
