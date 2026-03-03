import React, { useState, useEffect } from 'react';
import './CartModal.css';

const CartModal = ({ isOpen, onClose, cartItems = [], onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [localItems, setLocalItems] = useState(cartItems);

  useEffect(() => {
    setLocalItems(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'cart-modal-overlay') {
      onClose();
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = localItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setLocalItems(updatedItems);
    
    if (onUpdateQuantity) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleRemove = (itemId) => {
    const updatedItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(updatedItems);
    
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const calculateSubtotal = () => {
    return localItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal(); // No tax/VAT applied
  };

  const handleCheckout = () => {
    if (localItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    if (onCheckout) {
      onCheckout(localItems);
    } else {
      alert('Checkout functionality - To be implemented');
    }
    onClose();
  };

  return (
    <div className="cart-modal-overlay" onClick={handleOverlayClick}>
      <div className="cart-modal">
        <div className="cart-modal-header">
          <div className="cart-header-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="cart-icon">
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
            </svg>
            <h2>Shopping Cart</h2>
            <span className="cart-count">({localItems.length} {localItems.length === 1 ? 'item' : 'items'})</span>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </div>

        <div className="cart-modal-body">
          {localItems.length === 0 ? (
            <div className="cart-empty">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              </svg>
              <h3>Your cart is empty</h3>
              <p>Add some motorcycle parts to get started!</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {localItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-item-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    {item.brand && <span className="cart-item-brand">{item.brand}</span>}
                    <div className="cart-item-price">₱{item.price.toLocaleString()}</div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max="99"
                      />
                      <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </div>

                    <button
                      className="remove-item-btn"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {localItems.length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal:</span>
                <span>₱{calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="cart-summary-row cart-total">
                <span>Total:</span>
                <span>₱{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="cart-actions">
              <button className="continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
