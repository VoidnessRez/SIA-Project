import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import CartModal from './CartModal.jsx';
import './FloatingCart.css';

const FloatingCart = ({ itemCount = 0, cartItems = [] }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Don't render cart if user is not logged in
  if (!isAuthenticated()) {
    return null;
  }

  // Sample cart items for demonstration
  const sampleItems = cartItems.length > 0 ? cartItems : [
    {
      id: 1,
      name: 'Motorcycle Chain Set',
      brand: 'RK Chain',
      price: 2500,
      quantity: 2,
      image: null
    },
    {
      id: 2,
      name: 'Brake Pads Front',
      brand: 'Brembo',
      price: 1200,
      quantity: 1,
      image: null
    },
    {
      id: 3,
      name: 'Engine Oil Filter',
      brand: 'K&N',
      price: 450,
      quantity: 3,
      image: null
    }
  ];

  const handleUpdateQuantity = (itemId, newQuantity) => {
    // TODO: Implement cart update logic
    console.log(`Update item ${itemId} to quantity ${newQuantity}`);
  };

  const handleRemoveItem = (itemId) => {
    // TODO: Implement cart remove logic
    console.log(`Remove item ${itemId}`);
  };

  const handleCheckout = (items) => {
    // TODO: Implement checkout logic
    console.log('Checkout items:', items);
    alert('Checkout functionality - To be implemented');
  };

  const displayItemCount = cartItems.length > 0 ? cartItems.length : sampleItems.length;

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
        cartItems={sampleItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </>
  );
};

export default FloatingCart;