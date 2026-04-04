import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Orders.css';

const BACKEND_URL = 'http://localhost:5174';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/orders`);
      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        setOrders([]);
        return;
      }

      const filteredByUser = user?.id
        ? result.data.filter((order) => order.user_id === user.id)
        : result.data;

      const transformed = filteredByUser.map((order) => ({
        id: order.order_number || `ORD-${order.id}`,
        date: order.order_date || order.created_at,
        status: order.order_status || 'pending_approval',
        total: Number(order.total_amount || 0),
        items: (order.order_items || []).map((item) => ({
          name: item.product_name,
          quantity: Number(item.quantity || 0),
          price: Number(item.unit_price || 0),
          image: item.product_image || '📦',
          sku: item.product_sku
        })),
        shippingAddress: [order.delivery_barangay, order.delivery_city, order.delivery_province].filter(Boolean).join(', ') || 'N/A',
        paymentMethod: order.payment_method || 'N/A',
        trackingNumber: order.tracking_number || 'Pending',
        fulfillmentMethod: order.fulfillment_method || 'delivery'
      }));

      setOrders(transformed);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      delivered: { icon: '✅', label: 'Delivered', color: '#28a745' },
      shipped: { icon: '🚚', label: 'Shipped', color: '#17a2b8' },
      processing: { icon: '⏳', label: 'Processing', color: '#ffc107' },
      pending_approval: { icon: '⏳', label: 'Pending Approval', color: '#ffc107' },
      confirmed: { icon: '✅', label: 'Confirmed', color: '#17a2b8' },
      cancelled: { icon: '❌', label: 'Cancelled', color: '#dc3545' },
    };
    return statusMap[status] || { icon: '❓', label: 'Unknown', color: '#6c757d' };
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'processing') return ['processing', 'pending_approval', 'confirmed'].includes(order.status);
    return order.status === activeTab;
  });

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleViewReceipt = (order) => {
    // Transform order data to receipt format
    const receiptData = {
      orderNumber: order.id,
      timestamp: new Date(order.date).toISOString(),
      customer: {
        name: 'Customer Name', // Would come from user profile in real scenario
        email: 'customer@email.com',
        phone: '09123456789'
      },
      items: order.items.map(item => ({
        id: item.sku || item.name,
        name: item.name,
        sku: item.sku || 'N/A',
        image: item.image,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal: order.total,
      shippingFee: 0,
      discount: null,
      total: order.total,
      paymentMethod: order.paymentMethod,
      fulfillmentMethod: 'delivery'
    };

    // Navigate to receipt with order data
    navigate('/receipt', { 
      state: { orderDetails: receiptData } 
    });
  };

  const calculateOrderStats = () => {
    return {
      total: orders.length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      processing: orders.filter(o => o.status === 'processing').length,
      totalSpent: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0),
    };
  };

  const stats = calculateOrderStats();

  return (
    <div className="orders-page">
      <div className="orders-hero">
        <h1>Order History</h1>
        <p>Track and manage all your motorcycle parts orders</p>
      </div>

      <div className="orders-container">
        {loading && <p>Loading your orders...</p>}
        {/* Order Statistics */}
        <div className="orders-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.delivered}</h3>
              <p>Delivered</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <h3>{stats.shipped}</h3>
              <p>Shipped</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>₱{stats.totalSpent.toLocaleString()}</h3>
              <p>Total Spent</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="order-tabs">
          <button
            className={`order-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Orders ({orders.length})
          </button>
          <button
            className={`order-tab ${activeTab === 'processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('processing')}
          >
            Processing ({orders.filter(o => ['processing', 'pending_approval', 'confirmed'].includes(o.status)).length})
          </button>
          <button
            className={`order-tab ${activeTab === 'shipped' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipped')}
          >
            Shipped ({orders.filter(o => o.status === 'shipped').length})
          </button>
          <button
            className={`order-tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            Delivered ({orders.filter(o => o.status === 'delivered').length})
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {!loading && filteredOrders.length === 0 ? (
            <div className="no-orders">
              <h3>😔 No orders found</h3>
              <p>You haven't placed any orders yet or no orders match the filter</p>
              <button className="shop-now-btn" onClick={() => navigate('/products')}>Start Shopping →</button>
            </div>
          ) : (
            filteredOrders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-id-section">
                      <h3>{order.id}</h3>
                      <span className="order-date">📅 {new Date(order.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="order-status" style={{ color: statusInfo.color }}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-label">{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="order-items-preview">
                    {order.items.map((item, index) => (
                      <div key={index} className="item-preview">
                        {String(item.image || '').startsWith('http') ? (
                          <img className="item-image" src={item.image} alt={item.name} />
                        ) : (
                          <span className="item-image">{item.image}</span>
                        )}
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <span className="total-label">Total:</span>
                      <span className="total-amount">₱{order.total.toLocaleString()}</span>
                    </div>
                    <button 
                      className="view-details-btn"
                      onClick={() => openOrderDetails(order)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-modal" onClick={closeOrderDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeOrderDetails}>✕</button>

            <div className="modal-header">
              <h2>Order Details</h2>
              <div className="order-id-badge">{selectedOrder.id}</div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>📦 Order Status</h3>
                <div className="status-badge" style={{ backgroundColor: getStatusInfo(selectedOrder.status).color }}>
                  {getStatusInfo(selectedOrder.status).icon} {getStatusInfo(selectedOrder.status).label}
                </div>
                <p className="detail-text">Order Date: {new Date(selectedOrder.date).toLocaleDateString()}</p>
                <p className="detail-text">Tracking Number: <strong>{selectedOrder.trackingNumber}</strong></p>
              </div>

              <div className="detail-section">
                <h3>🛍️ Items ({selectedOrder.items.length})</h3>
                <div className="modal-items-list">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="modal-item">
                      {String(item.image || '').startsWith('http') ? (
                        <img className="modal-item-image" src={item.image} alt={item.name} />
                      ) : (
                        <span className="modal-item-image">{item.image}</span>
                      )}
                      <div className="modal-item-info">
                        <h4>{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="modal-item-price">₱{item.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>📍 Shipping Address</h3>
                <p className="detail-text">{selectedOrder.shippingAddress}</p>
              </div>

              <div className="detail-section">
                <h3>💳 Payment Method</h3>
                <p className="detail-text">{selectedOrder.paymentMethod}</p>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{selectedOrder.total.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span>₱{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions">
                {selectedOrder.status === 'delivered' && (
                  <button className="action-btn reorder-btn">🔄 Reorder</button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button className="action-btn track-btn">📦 Track Package</button>
                )}
                <button 
                  className="action-btn download-btn"
                  onClick={() => handleViewReceipt(selectedOrder)}
                >
                  📄 View Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
