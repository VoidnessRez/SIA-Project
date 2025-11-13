import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import CartModal from './CartModal.jsx';
import './FloatingCart.css';

const FloatingCart = ({ itemCount = 0, cartItems = [] }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [localCart, setLocalCart] = useState([]);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setLocalCart(JSON.parse(savedCart));
      }
    };
    
    loadCart();
    // Refresh cart when modal opens
    if (isCartOpen) {
      loadCart();
    }
  }, [isCartOpen]);

  // Don't render cart if user is not logged in
  if (!isAuthenticated()) {
    return null;
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const updatedCart = localCart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleRemoveItem = (itemId) => {
    const updatedCart = localCart.filter(item => item.id !== itemId);
    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleCheckout = (items) => {
    // Cart will be read from localStorage in Checkout page
    window.location.href = '/checkout';
  };

  const displayItemCount = localCart.length;

  return (
    <>
      <button className="floating-cart" onClick={() => setIsCartOpen(true)}>
        <span className="cart-icon">🛒</span>
        {displayItemCount > 0 && <span className="cart-badge">{displayItemCount}</span>}
        <span className="cart-text">Cart</span>
      </button>

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={localCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </>
  );
};

export default FloatingCart;