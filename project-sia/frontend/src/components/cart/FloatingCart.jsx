import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import CartModal from './CartModal.jsx';
import './FloatingCart.css';

const FloatingCart = () => {
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

    // Listen for storage changes (when cart is updated from other components)
    const handleStorageChange = (e) => {
      if (e.key === 'cart' || e.type === 'storage') {
        loadCart();
      }
    };

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Don't render cart if user is not logged in
  if (!isAuthenticated()) {
    return null;
  }

  const getItemKey = (item) => item.cart_key || `${item.productType || item.category || 'product'}-${item.id}`;

  const handleUpdateQuantity = (itemKey, newQuantity) => {
    const updatedCart = localCart.map(item =>
      getItemKey(item) === itemKey ? { ...item, quantity: newQuantity } : item
    );
    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    // Notify other components about cart update
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemoveItem = (itemKey) => {
    const updatedCart = localCart.filter(item => getItemKey(item) !== itemKey);
    setLocalCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    // Notify other components about cart update
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleCheckout = () => {
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