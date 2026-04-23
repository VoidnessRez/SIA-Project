import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import './Receipt.css';

const Receipt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const receiptRef = useRef();
  const [orderDetails, setOrderDetails] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: orderDetails ? `Receipt-${orderDetails.orderNumber}` : 'Receipt',
  });

  useEffect(() => {
    // Try to get order details from navigation state
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);
      // Save to localStorage as backup
      localStorage.setItem('lastReceipt', JSON.stringify(location.state.orderDetails));
    } else {
      // Try to get from localStorage
      const savedReceipt = localStorage.getItem('lastReceipt');
      if (savedReceipt) {
        setOrderDetails(JSON.parse(savedReceipt));
      } else {
        // No order details found, redirect to orders page
        navigate('/orders');
      }
    }
  }, [location, navigate]);

  if (!orderDetails) {
    return (
      <div className="receipt-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

  const getDisplayItem = (item) => {
    const rawName = String(item?.name || '').trim();
    const rawImage = String(item?.image || '').trim();
    const imageUrl = isUrl(rawImage) ? rawImage : (isUrl(rawName) ? rawName : '');
    const fallbackLabel = item?.sku ? `Product (${item.sku})` : 'Product Item';
    const name = rawName && !isUrl(rawName) ? rawName : fallbackLabel;
    const emoji = imageUrl ? null : (rawImage || '🏍️');

    return { name, imageUrl, emoji };
  };

  return (
    <div className="receipt-page">
      <div className="receipt-actions">
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print Receipt
        </button>
        <button className="btn-home" onClick={() => navigate('/')}>
          🏠 Back to Home
        </button>
        <button className="btn-continue" onClick={() => navigate('/products')}>
          🛍️ Continue Shopping
        </button>
        <button className="btn-orders" onClick={() => navigate('/orders')}>
          📋 View My Orders
        </button>
      </div>

      <div className="receipt-wrapper" ref={receiptRef}>
        <div className="receipt-container">
          {/* Header */}
          <div className="receipt-header">
            <div className="receipt-logo">
              <div className="logo-icon">🏍️</div>
              <div className="logo-text">
                <h1>Mejia Spareparts</h1>
                <p>and Accessories</p>
              </div>
            </div>
            <div className="receipt-title">
              <h2>OFFICIAL RECEIPT</h2>
              <div className="receipt-status">✅ Order Placed Successfully</div>
            </div>
          </div>

          {/* Order Info */}
          <div className="receipt-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Order Number:</span>
                <span className="info-value">{orderDetails.orderNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date & Time:</span>
                <span className="info-value">{formatDate(orderDetails.timestamp)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Customer Name:</span>
                <span className="info-value">{orderDetails.customer.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{orderDetails.customer.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact Number:</span>
                <span className="info-value">{orderDetails.customer.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Payment Method:</span>
                <span className="info-value">{orderDetails.paymentMethod}</span>
              </div>
            </div>

            {orderDetails.emailDelivery && (
              <div className={`receipt-email-debug ${orderDetails.emailDelivery.success ? 'ok' : 'warn'}`}>
                <h4>Email Delivery Status</h4>
                <p><span>Success:</span> {orderDetails.emailDelivery.success ? 'Yes' : 'No'}</p>
                <p><span>Provider:</span> {orderDetails.emailDelivery.provider || 'unknown'}</p>
                <p><span>Accepted:</span> {(orderDetails.emailDelivery.accepted || []).join(', ') || 'none'}</p>
                <p><span>Rejected:</span> {(orderDetails.emailDelivery.rejected || []).join(', ') || 'none'}</p>
                <p><span>Response:</span> {orderDetails.emailDelivery.response || 'no-response'}</p>
                <p><span>Message:</span> {orderDetails.emailDelivery.message || '-'}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="receipt-items">
            <h3>Order Items</h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.items.map((item, index) => {
                  const displayItem = getDisplayItem(item);
                  return (
                    <tr key={index}>
                      <td>
                        <div className="item-name-cell">
                          {displayItem.imageUrl ? (
                            <img
                              className="item-thumb"
                              src={displayItem.imageUrl}
                              alt={displayItem.name}
                            />
                          ) : (
                            <span className="item-emoji">{displayItem.emoji}</span>
                          )}
                          <span className="item-name-text">{displayItem.name}</span>
                        </div>
                      </td>
                      <td>{item.sku}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">₱{item.price.toLocaleString()}</td>
                      <td className="text-right">₱{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>₱{orderDetails.subtotal.toLocaleString()}</span>
            </div>
            {orderDetails.discount && (
              <div className="total-row discount-row">
                <span>🎉 {orderDetails.discount.type} Discount (20%):</span>
                <span>-₱{orderDetails.discount.amount.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>TOTAL AMOUNT:</span>
              <span>₱{orderDetails.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div className="footer-note">
              <p>⚠️ <strong>Order Status:</strong> PENDING APPROVAL</p>
              <p>Your order has been received and is pending approval from our admin team.</p>
              <p>You will receive an email notification once your order is approved and ready for processing.</p>
            </div>
            <div className="footer-contact">
              <p>📧 Email: support@mejiaspareparts.com</p>
              <p>📞 Contact: 09123456789</p>
              <p>📍 Address: Antipolo City, Rizal</p>
            </div>
            <div className="footer-thanks">
              <p>Thank you for shopping with us!</p>
              <p className="footer-tagline">Your trusted motorcycle parts supplier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
