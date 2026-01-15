import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import './Receipt.css';

const Receipt = ({ orderDetails }) => {
  const navigate = useNavigate();
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${orderDetails.orderNumber}`,
  });

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

  return (
    <div className="receipt-page">
      <div className="receipt-actions">
        <button className="btn-print" onClick={handlePrint}>
          🖨️ Print Receipt
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
                {orderDetails.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="item-name-cell">
                        <span className="item-emoji">{item.image}</span>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>{item.sku}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">₱{item.price.toLocaleString()}</td>
                    <td className="text-right">₱{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
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
