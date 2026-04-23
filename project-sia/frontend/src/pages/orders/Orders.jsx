import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Orders.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAllModalItems, setShowAllModalItems] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reuploadReason, setReuploadReason] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptZoom, setReceiptZoom] = useState(1);

   
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
        rawId: order.id,
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
        deliveryCity: order.delivery_city || null,
        deliveryProvince: order.delivery_province || null,
        paymentMethod: order.payment_method || 'N/A',
        paymentStatus: order.payment_status || 'pending',
        adminNotes: order.admin_notes || '',
        paymentProofUrl: order.payment_proof_url || null,
        trackingNumber: order.tracking_number || 'Pending',
        fulfillmentMethod: order.fulfillment_method || 'delivery',
        cancellationReason: order.cancellation_reason || null
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
      incomplete_txn: { icon: '📄', label: 'Incomplete Transaction', color: '#f59e0b' },
      confirmed: { icon: '✅', label: 'Confirmed', color: '#17a2b8' },
      buyer_cancelled: { icon: '🙋', label: 'Cancelled by You', color: '#dc3545' },
      declined_admin: { icon: '🛑', label: 'Declined by Admin', color: '#b91c1c' },
      cancelled: { icon: '❌', label: 'Cancelled', color: '#dc3545' },
    };
    return statusMap[status] || { icon: '❓', label: 'Unknown', color: '#6c757d' };
  };

  const handleBuyerCancel = async (order) => {
    const isPaidGcash =
      String(order?.paymentMethod || '').toLowerCase() === 'gcash' &&
      String(order?.paymentStatus || '').toLowerCase() === 'paid';

    const reasonInput = window.prompt('Reason for cancellation (optional):');
    const reason = String(reasonInput || '').trim();

    const confirmText = isPaidGcash
      ? 'Cancel this order? GCash downpayment is NON-REFUNDABLE and this cannot be undone.'
      : 'Cancel this order? This cannot be undone.';

    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${order.rawId}/cancel-by-buyer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellation_reason: reason || undefined })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to cancel order');
      }

      alert('✅ Order cancelled successfully');
      closeOrderDetails();
      fetchOrders();
    } catch (error) {
      console.error('Buyer cancellation error:', error);
      alert(`Failed to cancel order: ${error.message}`);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'processing') {
      return ['processing', 'pending_approval', 'incomplete_txn', 'confirmed'].includes(order.status);
    }
    return order.status === activeTab;
  });

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowAllModalItems(false);
    setProofFile(null);
    setReuploadReason('');
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowAllModalItems(false);
    setProofFile(null);
    setReuploadReason('');
    setShowReceiptModal(false);
    setReceiptZoom(1);
  };

  const isGcashPayment = String(selectedOrder?.paymentMethod || '').toLowerCase() === 'gcash';

  const canUploadPaymentProof = (order) => {
    const allowedStatuses = ['pending_approval', 'incomplete_txn', 'confirmed'];
    return isGcashPayment && allowedStatuses.includes(order?.status);
  };

  const getPaymentStatusLabel = (status) => {
    const value = String(status || 'pending').toLowerCase();
    const map = {
      pending: '⏳ Pending Verification',
      paid: '✅ Verified Paid',
      failed: '❌ Rejected/Blurry',
      refunded: '↩️ Refunded'
    };
    return map[value] || value;
  };

  const handleZoomInReceipt = () => {
    setReceiptZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOutReceipt = () => {
    setReceiptZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleUploadPaymentProof = async () => {
    if (!selectedOrder?.rawId) return;
    if (!proofFile) {
      alert('Please choose a receipt image first.');
      return;
    }

    if (String(selectedOrder?.paymentStatus || '').toLowerCase() === 'failed' && !reuploadReason.trim()) {
      alert('Please provide a reason/note for reupload.');
      return;
    }

    try {
      setUploadingProof(true);

      const formData = new FormData();
      formData.append('receipt', proofFile);
      formData.append('orderId', String(selectedOrder.rawId));
      if (reuploadReason.trim()) {
        formData.append('reupload_reason', reuploadReason.trim());
      }
      if (user?.id) {
        formData.append('userId', String(user.id));
      }

      const response = await fetch(`${BACKEND_URL}/api/upload/payment-proof`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to upload receipt');
      }

      setProofFile(null);
      setReuploadReason('');
      alert('✅ GCash receipt uploaded successfully');
      await fetchOrders();

      setSelectedOrder((prev) => (prev ? {
        ...prev,
        paymentProofUrl: result?.data?.payment_proof_url || result?.url || prev.paymentProofUrl,
        paymentStatus: result?.data?.payment_status || prev.paymentStatus,
        status: result?.data?.order_status || prev.status,
        adminNotes: result?.data?.admin_notes || prev.adminNotes
      } : prev));
    } catch (error) {
      console.error('Payment proof upload error:', error);
      alert(`Failed to upload receipt: ${error.message}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleViewReceipt = (order) => {
    // Transform order data to receipt format
    const receiptData = {
      orderNumber: order.id,
      timestamp: new Date(order.date).toISOString(),
      customer: {
        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Customer',
        email: user?.email || 'N/A',
        phone: user?.phone || 'N/A'
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
      fulfillmentMethod: order.fulfillmentMethod || 'delivery'
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
      processing: orders.filter(o => ['processing', 'pending_approval', 'incomplete_txn', 'confirmed'].includes(o.status)).length,
      totalSpent: orders
        .filter(o => !['cancelled', 'buyer_cancelled', 'declined_admin'].includes(o.status))
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
            Processing ({orders.filter(o => ['processing', 'pending_approval', 'incomplete_txn', 'confirmed'].includes(o.status)).length})
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
                {selectedOrder.trackingNumber && selectedOrder.trackingNumber !== 'Pending' && (
                  <p className="detail-text">Tracking Number: <strong>{selectedOrder.trackingNumber}</strong></p>
                )}
              </div>

              <div className="detail-section">
                <h3>🛍️ Items ({selectedOrder.items.length})</h3>
                <div className="modal-items-list">
                  {(showAllModalItems || selectedOrder.items.length < 2
                    ? selectedOrder.items
                    : selectedOrder.items.slice(0, 1)).map((item, index) => (
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
                {selectedOrder.items.length >= 2 && (
                  <button
                    type="button"
                    className="see-more-items-btn"
                    onClick={() => setShowAllModalItems((prev) => !prev)}
                  >
                    {showAllModalItems
                      ? 'See less'
                      : `See more (${selectedOrder.items.length - 1} more item${selectedOrder.items.length - 1 > 1 ? 's' : ''})`}
                  </button>
                )}
              </div>

              <div className="detail-section">
                <h3>📍 Shipping Address</h3>
                <p className="detail-text">
                  {selectedOrder.fulfillmentMethod === 'pickup'
                    ? 'Store Pickup'
                    : [selectedOrder.deliveryCity, selectedOrder.deliveryProvince].filter(Boolean).join(', ') || selectedOrder.shippingAddress}
                </p>
              </div>

              {['cancelled', 'buyer_cancelled', 'declined_admin'].includes(selectedOrder.status) && selectedOrder.cancellationReason && (
                <div className="detail-section">
                  <h3>📝 Cancellation Reason</h3>
                  <p className="detail-text">{selectedOrder.cancellationReason}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>💳 Payment Method</h3>
                <p className="detail-text">{selectedOrder.paymentMethod}</p>
                {isGcashPayment && (
                  <p className="detail-text"><strong>Status:</strong> {getPaymentStatusLabel(selectedOrder.paymentStatus)}</p>
                )}
              </div>

              {isGcashPayment && (
                <div className="detail-section">
                  <h3>📱 GCash Receipt</h3>

                  {selectedOrder.paymentProofUrl ? (
                    <p className="detail-text">
                      Proof uploaded.{' '}
                      <button
                        type="button"
                        className="view-receipt-link-btn"
                        onClick={() => {
                          setReceiptZoom(1);
                          setShowReceiptModal(true);
                        }}
                      >
                        View uploaded receipt
                      </button>
                    </p>
                  ) : (
                    <p className="detail-text">No receipt uploaded yet.</p>
                  )}
      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder?.paymentProofUrl && (
        <div className="order-modal" style={{ zIndex: 1200, background: 'rgba(0,0,0,0.6)' }} onClick={() => {
          setShowReceiptModal(false);
          setReceiptZoom(1);
        }}>
          <div className="modal-content" style={{ maxWidth: 480, minHeight: 200, textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="close-modal" style={{ position: 'absolute', top: 10, right: 10 }} onClick={() => {
              setShowReceiptModal(false);
              setReceiptZoom(1);
            }}>✕</button>
            <h3 style={{ marginTop: 24 }}>GCash Receipt</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <button type="button" className="receipt-zoom-btn" onClick={handleZoomOutReceipt} disabled={receiptZoom <= 0.5}>- Zoom Out</button>
              <span style={{ fontWeight: 600 }}>{Math.round(receiptZoom * 100)}%</span>
              <button type="button" className="receipt-zoom-btn" onClick={handleZoomInReceipt} disabled={receiptZoom >= 3}>+ Zoom In</button>
            </div>
            <div style={{ margin: '18px 0' }}>
              {selectedOrder.paymentProofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div style={{ maxHeight: 420, overflow: 'auto', borderRadius: 8 }}>
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="GCash Receipt"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 520,
                      borderRadius: 8,
                      boxShadow: '0 2px 12px #0002',
                      transform: `scale(${receiptZoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </div>
              ) : selectedOrder.paymentProofUrl.match(/\.(pdf)$/i) ? (
                <div style={{ maxHeight: 420, overflow: 'auto', borderRadius: 8 }}>
                  <iframe
                    src={selectedOrder.paymentProofUrl}
                    title="GCash Receipt PDF"
                    style={{
                      width: '100%',
                      height: 420,
                      border: 'none',
                      borderRadius: 8,
                      transform: `scale(${receiptZoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </div>
              ) : (
                <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer">Open receipt</a>
              )}
            </div>
          </div>
        </div>
      )}

                  {canUploadPaymentProof(selectedOrder) && (
                    <div className="payment-proof-upload">
                      <textarea
                        className="payment-proof-note"
                        value={reuploadReason}
                        onChange={(e) => setReuploadReason(e.target.value)}
                        placeholder="Type your reason or note for this upload (required if previously rejected)"
                        rows={2}
                        disabled={uploadingProof}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        disabled={uploadingProof}
                      />
                      <button
                        type="button"
                        className="action-btn download-btn"
                        onClick={handleUploadPaymentProof}
                        disabled={uploadingProof || !proofFile || (String(selectedOrder?.paymentStatus || '').toLowerCase() === 'failed' && !reuploadReason.trim())}
                      >
                        {uploadingProof ? 'Uploading...' : 'Upload GCash Receipt'}
                      </button>
                    </div>
                  )}

                  {String(selectedOrder?.paymentStatus || '').toLowerCase() === 'failed' && selectedOrder.adminNotes && (
                    <p className="detail-text">
                      <strong>Admin Note:</strong> {selectedOrder.adminNotes}
                    </p>
                  )}
                </div>
              )}

              <div className="order-details-summary">
                <div className="order-details-summary-row">
                  <span>Subtotal:</span>
                  <span>₱{selectedOrder.total.toLocaleString()}</span>
                </div>
                <div className="order-details-summary-row">
                  <span>Shipping:</span>
                  <span>{selectedOrder.fulfillmentMethod === 'pickup' ? 'Free' : 'By Area'}</span>
                </div>
                <div className="order-details-summary-row total-row">
                  <span>Total:</span>
                  <span>₱{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions">
                {['pending_approval', 'incomplete_txn', 'confirmed'].includes(selectedOrder.status) && (
                  <button className="action-btn cancel-order-btn" onClick={() => handleBuyerCancel(selectedOrder)}>
                    ❌ Cancel Order
                  </button>
                )}
                {selectedOrder.status === 'delivered' && (
                  <button className="action-btn reorder-order-btn">🔄 Reorder</button>
                )}
                <button 
                  className="action-btn download-btn receipt-btn"
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
