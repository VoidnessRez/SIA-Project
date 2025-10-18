import React from 'react';
import './FloatingCart.css';

const FloatingCart = ({ itemCount = 0 }) => {
  return (
    <button className="floating-cart" onClick={() => alert('Cart clicked!')}>
      <span className="cart-icon">🛒</span>
      {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
      <span className="cart-text">Cart</span>
    </button>
  );
};

export default FloatingCart;