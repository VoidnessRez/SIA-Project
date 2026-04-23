import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import StorageUtils from '../../../../utils/storageUtils';
import './CustomerOrders.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store ALL orders for counting
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending_approval, incomplete_txn, confirmed, processing, shipped, delivered, declined_admin, buyer_cancelled, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [originalAdminNotes, setOriginalAdminNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [showAllModalItems, setShowAllModalItems] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

   
  useEffect(() => {
    fetchOrders();
  }, []); // Fetch once on mount, not on filter change

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('[CustomerOrders] 📋 Fetching all orders...');

      // Minimum 2 second delay for skeleton visibility (like inventory)
      const [queryResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_type,
              product_id,
              product_sku,
              product_name,
              product_image,
              selected_size,
              selected_color,
              quantity,
              unit_price,
              subtotal,
              discount,
              total
            )
          `)
          .order('order_date', { ascending: false }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      const { data, error } = queryResult;

      if (error) {
        console.error('[CustomerOrders] ❌ Error fetching orders:', error);
        throw error;
      }

      console.log('[CustomerOrders] ✅ Orders fetched:', data?.length);
      
      // Store ALL orders
      const allOrdersData = data || [];
      setAllOrders(allOrdersData);
      
      // Set displayed orders based on current filter
      if (filter === 'all') {
        setOrders(allOrdersData);
      } else {
        setOrders(allOrdersData.filter(o => o.order_status === filter));
      }

    } catch (error) {
      console.error('[CustomerOrders] 💥 Error:', error);
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || '');
    setOriginalAdminNotes(order.admin_notes || '');
    setShowAllModalItems(false);
    setRejectReason('');
    setShowModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;

    try {
      setNotesSaving(true);

      const { error } = await supabase
        .from('orders')
        .update({
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      setOriginalAdminNotes(adminNotes);
      setSelectedOrder((prev) => (prev ? { ...prev, admin_notes: adminNotes } : prev));
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, admin_notes: adminNotes } : o)));
      setAllOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, admin_notes: adminNotes } : o)));
      alert('✅ Admin notes saved');
    } catch (error) {
      console.error('[CustomerOrders] ❌ Error saving admin notes:', error);
      alert('Failed to save admin notes');
    } finally {
      setNotesSaving(false);
    }
  };

  const getCountForStatus = (status) => {
    if (status === 'all') return allOrders.length;
    return allOrders.filter(o => o.order_status === status).length;
  };

  // Helper function to filter orders by status
  const getFilteredOrders = (status) => {
    if (status === 'all') return allOrders;
    return allOrders.filter(o => o.order_status === status);
  };

  // Handle filter tab click
  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
    setOrders(getFilteredOrders(newFilter));
    console.log('[CustomerOrders] 🔍 Filter changed to:', newFilter);
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;

    if (!window.confirm('Approve this order? Customer will be notified.')) {
      return;
    }

    try {
      setActionLoading(true);

      const adminUser = StorageUtils.getFromSessionStorage('adminToken', null);

      if (!adminUser?.id) {
        alert('❌ Admin session not found. Please log in again.');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'confirmed',
          confirmed_by: adminUser.id,
          confirmed_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      alert('✅ Order approved successfully!');
      setShowModal(false);
      fetchOrders();
    } catch {
      alert('Failed to approve order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineOrder = async () => {
    if (!selectedOrder) return;

    const reasonInput = prompt('Enter reason for declining this order:');
    const reason = String(reasonInput || '').trim();
    if (!reason) {
      alert('Decline reason is required.');
      return;
    }

    try {
      setActionLoading(true);
      console.log('[CustomerOrders] ❌ Declining order:', selectedOrder.order_number);

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'declined_admin',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      console.log('[CustomerOrders] ✅ Order declined');
      alert('❌ Order declined successfully');
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('[CustomerOrders] ❌ Error declining order:', error);
      alert('Failed to decline order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;

    if (!window.confirm(`Update order status to "${newStatus}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      console.log('[CustomerOrders] 🔄 Updating order status to:', newStatus);

      const updateData = {
        order_status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      // Add timestamp fields based on status
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      console.log('[CustomerOrders] ✅ Order status updated');
      alert(`✅ Order status updated to "${newStatus}"`);
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('[CustomerOrders] ❌ Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async (nextPaymentStatus) => {
    if (!selectedOrder) return;

    const isReject = nextPaymentStatus === 'failed';
    const note = String(rejectReason || '').trim();

    if (isReject && !note) {
      alert('Rejection reason is required.');
      return;
    }

    const actionLabel = isReject ? 'reject' : 'approve';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this payment?`)) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/orders/${selectedOrder.id}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_status: nextPaymentStatus,
          admin_reason: isReject ? note : undefined,
          verification_note: !isReject ? note : undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update payment status');
      }

      alert(`✅ Payment ${isReject ? 'rejected' : 'approved'} successfully`);
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('[CustomerOrders] ❌ Payment verification error:', error);
      alert(`Failed to update payment: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPaymentStatusLabel = (status) => {
    const value = String(status || 'pending').toLowerCase();
    const map = {
      pending: '⏳ Pending Verification',
      paid: '✅ Paid (Verified)',
      failed: '❌ Rejected',
      refunded: '↩️ Refunded'
    };
    return map[value] || value;
  };

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email?.toLowerCase().includes(query) ||
      order.customer_phone?.includes(query)
    );
  });

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'pending_approval': 'status-pending-approval',
      'incomplete_txn': 'status-incomplete-transaction',
      'confirmed': 'status-confirmed',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'declined_admin': 'status-cancelled',
      'buyer_cancelled': 'status-cancelled',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending_approval': '⏳ Pending Approval',
      'incomplete_txn': '📄 Incomplete Transaction',
      'confirmed': '✅ Confirmed',
      'processing': '⚙️ Processing',
      'shipped': '🚚 Shipped',
      'delivered': '📦 Delivered',
      'declined_admin': '🛑 Declined by Admin',
      'buyer_cancelled': '🙋 Cancelled by Buyer',
      'cancelled': '❌ Cancelled'
    };
    return labels[status] || status;
  };

  const pendingCount = getCountForStatus('pending_approval');

  return (
    <AdminLayout title="Customer Orders" description="Manage and track customer orders">
      <div className="customer-orders-page">
        <div className="page-header">
        <div className="header-content">
  
        </div>
        {pendingCount > 0 && (
          <div className="pending-badge">
            {pendingCount} Pending Approval
          </div>
        )}
      </div>

      {/* Filters */}
      {loading ? (
        <div className="orders-controls">
          <div className="filter-tabs">
            <div className="skeleton-filter-btn active"></div>
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
            <div className="skeleton-filter-btn"></div>
          </div>
          <div className="search-box">
            <div className="skeleton-search-box"></div>
          </div>
        </div>
      ) : (
        <div className="orders-controls">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              All Orders ({getCountForStatus('all')})
            </button>
            <button 
              className={`filter-tab ${filter === 'pending_approval' ? 'active' : ''}`}
              onClick={() => handleFilterClick('pending_approval')}
            >
              ⏳ Pending ({getCountForStatus('pending_approval')})
            </button>
            <button 
              className={`filter-tab ${filter === 'incomplete_txn' ? 'active' : ''}`}
              onClick={() => handleFilterClick('incomplete_txn')}
            >
              📄 Incomplete ({getCountForStatus('incomplete_txn')})
            </button>
            <button 
              className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
              onClick={() => handleFilterClick('confirmed')}
            >
              ✅ Confirmed ({getCountForStatus('confirmed')})
            </button>
            <button 
              className={`filter-tab ${filter === 'processing' ? 'active' : ''}`}
              onClick={() => handleFilterClick('processing')}
            >
              ⚙️ Processing ({getCountForStatus('processing')})
            </button>
            <button 
              className={`filter-tab ${filter === 'shipped' ? 'active' : ''}`}
              onClick={() => handleFilterClick('shipped')}
            >
              🚚 Shipped ({getCountForStatus('shipped')})
            </button>
            <button 
              className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
              onClick={() => handleFilterClick('delivered')}
            >
              📦 Delivered ({getCountForStatus('delivered')})
            </button>
            <button 
              className={`filter-tab ${filter === 'declined_admin' ? 'active' : ''}`}
              onClick={() => handleFilterClick('declined_admin')}
            >
              🛑 Declined ({getCountForStatus('declined_admin')})
            </button>
            <button 
              className={`filter-tab ${filter === 'buyer_cancelled' ? 'active' : ''}`}
              onClick={() => handleFilterClick('buyer_cancelled')}
            >
              🙋 Buyer Cancelled ({getCountForStatus('buyer_cancelled')})
            </button>
            <button 
              className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
              onClick={() => handleFilterClick('cancelled')}
            >
              ❌ Cancelled ({getCountForStatus('cancelled')})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search orders by ID, customer name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="orders-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="order-skeleton-card">
              <div className="skeleton-order-header">
                <div className="skeleton-order-number"></div>
                <div className="skeleton-order-amount"></div>
              </div>
              <div className="skeleton-detail-line"></div>
              <div className="skeleton-detail-line"></div>
              <div className="skeleton-detail-line"></div>
              <div className="skeleton-detail-line"></div>
              <div className="skeleton-detail-line"></div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>📭 No orders found</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card" onClick={() => handleViewOrder(order)}>
              <div className="order-header">
                <div className="order-id-section">
                  <h3>{order.order_number}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                    {getStatusLabel(order.order_status)}
                  </span>
                </div>
                <div className="order-amount">
                  ₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span className="label">👤 Customer:</span>
                  <span className="value">{order.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">📧 Email:</span>
                  <span className="value">{order.customer_email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">📞 Phone:</span>
                  <span className="value">{order.customer_phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">{order.fulfillment_method === 'pickup' ? '🏪' : '🚚'} Fulfillment:</span>
                  <span className="value">{order.fulfillment_method === 'pickup' ? 'Store Pickup' : 'Home Delivery'}</span>
                </div>
                {order.delivery_address && (
                  <>
                    <div className="detail-row">
                      <span className="label">📍 Address:</span>
                      <span className="value">
                        {order.delivery_address}, {order.delivery_barangay && `${order.delivery_barangay}, `}{order.delivery_city}, {order.delivery_province}
                      </span>
                    </div>
                  </>
                )}
                <div className="detail-row">
                  <span className="label">📅 Order Date:</span>
                  <span className="value">
                    {new Date(order.order_date).toLocaleString('en-PH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">📦 Items:</span>
                  <span className="value">{order.order_items?.length || 0} item(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content customer-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="order-info-section">
                <h3>Order Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Order Code:</label>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedOrder.order_status)}`}>
                      {getStatusLabel(selectedOrder.order_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items-section">
                <h3>Items Purchased</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllModalItems ? (selectedOrder.order_items || []) : (selectedOrder.order_items || []).slice(0, 2)).map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.product_sku}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(selectedOrder.order_items?.length || 0) > 2 && (
                  <button
                    type="button"
                    className="btn-save-notes items-toggle-btn"
                    onClick={() => setShowAllModalItems((prev) => !prev)}
                  >
                    {showAllModalItems
                      ? 'See less items'
                      : `See more (${(selectedOrder.order_items?.length || 0) - 2} more)`}
                  </button>
                )}
              </div>

              <div className="order-summary-section">
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {String(selectedOrder.payment_method || '').toLowerCase() === 'gcash' && (
                <div className="payment-verification-section">
                  <h3>💳 GCash Verification</h3>
                  <p><strong>Payment Status:</strong> {getPaymentStatusLabel(selectedOrder.payment_status)}</p>

                  <textarea
                    className="payment-reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Type reject/blurry reason for the customer"
                    rows={2}
                    disabled={actionLoading}
                  />

                  {selectedOrder.payment_proof_url ? (
                    <div className="payment-proof-preview">
                      <a href={selectedOrder.payment_proof_url} target="_blank" rel="noreferrer">
                        Open payment proof image
                      </a>
                      <img src={selectedOrder.payment_proof_url} alt="Payment proof" />
                    </div>
                  ) : (
                    <p>No payment proof uploaded yet.</p>
                  )}
                </div>
              )}

              {['cancelled', 'declined_admin', 'buyer_cancelled'].includes(selectedOrder.order_status) && (
                <div className="delivery-info-section">
                  <h3>📝 Cancellation Reason</h3>
                  <p><strong>Reason:</strong> {selectedOrder.cancellation_reason || 'No reason provided'}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="admin-notes-section">
                <h3>Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-save-notes"
                onClick={handleSaveNotes}
                disabled={notesSaving || actionLoading || adminNotes === originalAdminNotes}
              >
                {notesSaving ? 'Saving Notes...' : '💾 Save Notes'}
              </button>

              {String(selectedOrder.payment_method || '').toLowerCase() === 'gcash' && selectedOrder.payment_proof_url && (
                <>
                  <button
                    className="btn-approve"
                    onClick={() => handleVerifyPayment('paid')}
                    disabled={actionLoading}
                  >
                    ✅ Approve Payment
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleVerifyPayment('failed')}
                    disabled={actionLoading || !rejectReason.trim()}
                  >
                    ❌ Reject Payment
                  </button>
                </>
              )}

              {selectedOrder.order_status === 'pending_approval' && (
                <>
                  <button 
                    className="btn-decline" 
                    onClick={handleDeclineOrder}
                    disabled={actionLoading}
                  >
                    ❌ Decline Order
                  </button>
                  <button 
                    className="btn-approve" 
                    onClick={handleApproveOrder}
                    disabled={actionLoading}
                  >
                    ✅ Approve Order
                  </button>
                </>
              )}

              {selectedOrder.order_status === 'confirmed' && (
                <button 
                  className="btn-process" 
                  onClick={() => handleUpdateStatus('processing')}
                  disabled={actionLoading}
                >
                  ⚙️ Mark as Processing
                </button>
              )}

              {selectedOrder.order_status === 'processing' && (
                <button 
                  className="btn-ship" 
                  onClick={() => handleUpdateStatus('shipped')}
                  disabled={actionLoading}
                >
                  🚚 Mark as Shipped
                </button>
              )}

              {selectedOrder.order_status === 'shipped' && (
                <button 
                  className="btn-deliver" 
                  onClick={() => handleUpdateStatus('delivered')}
                  disabled={actionLoading}
                >
                  📦 Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default CustomerOrders;
