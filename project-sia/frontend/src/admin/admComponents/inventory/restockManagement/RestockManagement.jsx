import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './RestockManagement.css';

const BACKEND_URL = 'http://localhost:5174';

const RestockManagement = () => {
  const [restockOrders, setRestockOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, received, completed

  const [formData, setFormData] = useState({
    product_id: '',
    product_type: 'spare-parts',
    quantity: 0,
    supplier: '',
    expected_date: '',
    cost_per_unit: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [transactionsRes, productsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/transactions`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/products`).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      if (transactionsRes.success) {
        // Filter for restock-related transactions
        const restocks = (transactionsRes.data || []).filter(t => 
          t.transaction_type === 'restock' || t.transaction_type === 'purchase'
        );
        setRestockOrders(restocks);
      }

      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching restock data:', err);
      setError('Failed to load restock data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestock = () => {
    setFormData({
      product_id: '',
      product_type: 'spare-parts',
      quantity: 0,
      supplier: '',
      expected_date: new Date().toISOString().split('T')[0],
      cost_per_unit: 0,
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleSaveRestock = async () => {
    if (!formData.product_id || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          transaction_type: 'restock',
          status: 'pending'
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchData();
        alert('Restock order created successfully');
      } else {
        alert('Failed to create restock order');
      }
    } catch (err) {
      console.error('Error creating restock order:', err);
      alert('Error creating restock order');
    }
  };

  const handleMarkReceived = async (orderId) => {
    if (confirm('Mark this order as received?')) {
      alert(`Order #${orderId} marked as received`);
      // Call API to update status and add stock
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const filteredOrders = restockOrders.filter(order => {
    if (filter === 'pending') return order.status === 'pending' || order.status === 'ordered';
    if (filter === 'received') return order.status === 'received';
    if (filter === 'completed') return order.status === 'completed';
    return true;
  });

  if (loading) return (
    <AdminLayout title="Restock Management" description="Manage inventory restocking and deliveries">
      <SkeletonLoader type="content" rows={7} />
    </AdminLayout>
  );

  return (
    <AdminLayout title="Restock Management" description="Manage inventory restocking and deliveries">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Restock & Delivery Management</h2>
          <div className="header-actions">
            <div className="filter-buttons">
              <button 
                className={filter === 'pending' ? 'active' : ''} 
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={filter === 'received' ? 'active' : ''} 
                onClick={() => setFilter('received')}
              >
                Received
              </button>
              <button 
                className={filter === 'completed' ? 'active' : ''} 
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
            <button className="add-btn" onClick={handleAddRestock}>+ New Restock Order</button>
          </div>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Supplier</th>
                <th>Cost/Unit</th>
                <th>Total Cost</th>
                <th>Expected Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.product_name || 'N/A'}</td>
                    <td>{order.product_type || 'N/A'}</td>
                    <td>{order.quantity || 0}</td>
                    <td>{order.supplier || 'N/A'}</td>
                    <td>₱{order.cost_per_unit?.toFixed(2) || '0.00'}</td>
                    <td>₱{((order.quantity || 0) * (order.cost_per_unit || 0)).toFixed(2)}</td>
                    <td>{order.expected_date ? new Date(order.expected_date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="actions">
                      {(order.status === 'pending' || order.status === 'ordered') && (
                        <button className="receive-btn" onClick={() => handleMarkReceived(order.id)}>
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="10" className="no-data">No restock orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Restock Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create Restock Order</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Type *</label>
                  <select name="product_type" value={formData.product_type} onChange={handleInputChange}>
                    <option value="spare-parts">Spare Parts</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Product *</label>
                  <select name="product_id" value={formData.product_id} onChange={handleInputChange} required>
                    <option value="">Select Product</option>
                    {products
                      .filter(p => p.product_type === formData.product_type)
                      .map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (SKU: {product.sku})
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input 
                      type="number" 
                      name="quantity" 
                      value={formData.quantity} 
                      onChange={handleInputChange} 
                      min="1"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost Per Unit *</label>
                    <input 
                      type="number" 
                      name="cost_per_unit" 
                      value={formData.cost_per_unit} 
                      onChange={handleInputChange} 
                      step="0.01"
                      min="0"
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Supplier *</label>
                  <input 
                    type="text" 
                    name="supplier" 
                    value={formData.supplier} 
                    onChange={handleInputChange} 
                    placeholder="Supplier name"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Expected Delivery Date</label>
                  <input 
                    type="date" 
                    name="expected_date" 
                    value={formData.expected_date} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    rows="3"
                    placeholder="Additional notes..."
                  ></textarea>
                </div>

                <div className="total-cost">
                  <strong>Total Cost: </strong>
                  <span>₱{(formData.quantity * formData.cost_per_unit).toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveRestock}>Create Order</button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
          }

          .receive-btn {
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }

          .receive-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
          }

          .status-badge.pending,
          .status-badge.ordered {
            background: #fef5e7;
            color: #d68910;
          }

          .status-badge.received {
            background: #d5f4e6;
            color: #0b5345;
          }

          .status-badge.completed {
            background: #d6eaf8;
            color: #1f618d;
          }

          .total-cost {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: right;
            font-size: 1.1rem;
            margin-top: 1rem;
          }

          .total-cost span {
            color: #667eea;
            font-weight: 700;
          }

          @media (max-width: 768px) {
            .header-actions {
              flex-direction: column;
              align-items: stretch;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default RestockManagement;
