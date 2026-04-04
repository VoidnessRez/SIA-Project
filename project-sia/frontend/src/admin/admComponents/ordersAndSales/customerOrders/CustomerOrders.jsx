import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import StorageUtils from '../../../../utils/storageUtils';
import './CustomerOrders.css';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store ALL orders for counting
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending_approval, confirmed, processing, shipped, delivered, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

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
    setShowModal(true);
  };

  // Helper to update allOrders after an action
  const updateOrderInState = (updatedOrder) => {
    const updatedAllOrders = allOrders.map(o => 
      o.id === updatedOrder.id ? updatedOrder : o
    );
    setAllOrders(updatedAllOrders);
    
    // Update displayed orders
    if (filter === 'all') {
      setOrders(updatedAllOrders);
    } else {
      setOrders(updatedAllOrders.filter(o => o.order_status === filter));
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
    } catch (error) {
      alert('Failed to approve order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineOrder = async () => {
    if (!selectedOrder) return;

    const reason = prompt('Enter reason for declining this order:');
    if (!reason) return;

    try {
      setActionLoading(true);
      console.log('[CustomerOrders] ❌ Declining order:', selectedOrder.order_number);

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
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
      'confirmed': 'status-confirmed',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending_approval': '⏳ Pending Approval',
      'confirmed': '✅ Confirmed',
      'processing': '⚙️ Processing',
      'shipped': '🚚 Shipped',
      'delivered': '📦 Delivered',
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Order Info */}
              <div className="order-info-section">
                <h3>Order Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Order Number:</label>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedOrder.order_status)}`}>
                      {getStatusLabel(selectedOrder.order_status)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Fulfillment Method:</label>
                    <span className="fulfillment-badge">
                      {selectedOrder.fulfillment_method === 'pickup' ? '🏪 Store Pickup' : '🚚 Home Delivery'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Order Date:</label>
                    <span>{new Date(selectedOrder.order_date).toLocaleString('en-PH')}</span>
                  </div>
                  <div className="info-item">
                    <label>Payment Method:</label>
                    <span className="payment-badge">{selectedOrder.payment_method?.toUpperCase() || 'COD'}</span>
                  </div>
                  <div className="info-item">
                    <label>Payment Status:</label>
                    <span>{selectedOrder.payment_status?.toUpperCase() || 'PENDING'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="customer-info-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {selectedOrder.fulfillment_method === 'delivery' && selectedOrder.delivery_address && (
                <div className="delivery-info-section">
                  <h3>🚚 Delivery Information</h3>
                  <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>
                  <p><strong>Barangay:</strong> {selectedOrder.delivery_barangay || 'N/A'}</p>
                  <p><strong>City:</strong> {selectedOrder.delivery_city}</p>
                  <p><strong>Province:</strong> {selectedOrder.delivery_province}</p>
                  <p><strong>Zipcode:</strong> {selectedOrder.delivery_zipcode}</p>
                  {selectedOrder.delivery_notes && (
                    <p><strong>Notes:</strong> {selectedOrder.delivery_notes}</p>
                  )}
                </div>
              )}

              {selectedOrder.fulfillment_method === 'pickup' && (
                <div className="delivery-info-section">
                  <h3>🏪 Store Pickup</h3>
                  <p><strong>Method:</strong> Customer will pick up from store</p>
                  <p><strong>Location:</strong> Mejia Spareparts Main Store</p>
                  <p><strong>Hours:</strong> Mon-Sat, 8:00 AM - 6:00 PM</p>
                </div>
              )}

              {/* Order Items */}
              <div className="order-items-section">
                <h3>Order Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Variant</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.order_items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.product_sku}</td>
                        <td>
                          {item.selected_size && `Size: ${item.selected_size}`}
                          {item.selected_color && ` | Color: ${item.selected_color}`}
                          {!item.selected_size && !item.selected_color && '-'}
                        </td>
                        <td>{item.quantity}</td>
                        <td>₱{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>₱{parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="order-summary-section">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₱{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping Fee:</span>
                  <span>₱{parseFloat(selectedOrder.shipping_fee).toFixed(2)}</span>
                </div>
                {selectedOrder.tax_amount > 0 && (
                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>₱{parseFloat(selectedOrder.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.discount_amount > 0 && (
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-₱{parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <span>₱{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

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
