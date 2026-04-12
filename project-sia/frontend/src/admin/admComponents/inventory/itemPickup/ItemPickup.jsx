import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './ItemPickup.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const ItemPickup = () => {
  const [pickupOrders, setPickupOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, completed, cancelled

  useEffect(() => {
    fetchPickupOrders();
  }, []);

  const fetchPickupOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from transactions/orders to get pickup data
      const [response] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/transactions`),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      const data = await response.json();
      
      if (data.success) {
        // Filter for pickup-related transactions
        const pickups = (data.data || []).filter(t => t.transaction_type === 'pickup' || t.status === 'pending_pickup');
        setPickupOrders(pickups);
      } else {
        setError('Failed to fetch pickup orders');
      }
    } catch (err) {
      console.error('Error fetching pickup orders:', err);
      setError('Failed to load pickup orders. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = (orderId) => {
    alert(`Order #${orderId} marked as ready for pickup`);
    // Call API to update status
  };

  const handleCompletePickup = (orderId) => {
    alert(`Order #${orderId} pickup completed`);
    // Call API to update status
  };

  const filteredOrders = pickupOrders.filter(order => {
    if (filter === 'pending') return order.status === 'pending_pickup' || order.status === 'ready_for_pickup';
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  if (loading) return (
    <AdminLayout title="Item Pickup" description="Manage customer item pickups">
      <SkeletonLoader type="content" rows={6} />
    </AdminLayout>
  );

  return (
    <AdminLayout title="Item Pickup" description="Manage customer item pickups">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Item Pickup Management</h2>
          <div className="filter-buttons">
            <button 
              className={filter === 'pending' ? 'active' : ''} 
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={filter === 'completed' ? 'active' : ''} 
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={filter === 'cancelled' ? 'active' : ''} 
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="pickup-cards">
            {filteredOrders.map(order => (
              <div className="pickup-card" key={order.id}>
                <div className="card-header">
                  <h3>Order #{order.order_id || order.id}</h3>
                  <span className={`status-badge ${order.status}`}>{order.status}</span>
                </div>
                <div className="card-body">
                  <p><strong>Customer:</strong> {order.customer_name || 'N/A'}</p>
                  <p><strong>Items:</strong> {order.item_count || 1} item(s)</p>
                  <p><strong>Requested Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                  <p><strong>Total Amount:</strong> ₱{order.total_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="card-actions">
                  {order.status === 'pending_pickup' && (
                    <button className="btn-primary" onClick={() => handleMarkAsReady(order.id)}>
                      Mark as Ready
                    </button>
                  )}
                  {order.status === 'ready_for_pickup' && (
                    <button className="btn-success" onClick={() => handleCompletePickup(order.id)}>
                      Complete Pickup
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-container">
            <p>No pickup orders found</p>
          </div>
        )}

        <style>{`
          .pickup-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .pickup-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
          }

          .pickup-card:hover {
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f0f0f0;
          }

          .card-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.1rem;
          }

          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .status-badge.pending_pickup {
            background: #fef5e7;
            color: #d68910;
          }

          .status-badge.ready_for_pickup {
            background: #d5f4e6;
            color: #0b5345;
          }

          .card-body p {
            margin: 0.5rem 0;
            color: #555;
            font-size: 0.95rem;
          }

          .card-body strong {
            color: #2c3e50;
          }

          .card-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
          }

          .btn-primary, .btn-success {
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }

          .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }

          .btn-success {
            background: linear-gradient(135deg, #84fab0, #8fd3f4);
            color: white;
          }

          .btn-primary:hover, .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .no-data-container {
            text-align: center;
            padding: 3rem;
            color: #999;
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default ItemPickup;
