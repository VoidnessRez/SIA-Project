import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './LowStockAlerts.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const LowStockAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, critical, warning

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [response] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/low-stock`),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      const data = await response.json();

      if (data.success) {
        setLowStockItems(data.data || []);
      } else {
        setError('Failed to fetch low stock items');
      }
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      setError('Failed to load low stock alerts. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    const percentage = (item.stock_quantity / item.reorder_level) * 100;
    if (percentage === 0) return 'out-of-stock';
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'warning';
    return 'low';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'out-of-stock': '🔴 Out of Stock',
      'critical': '🔴 Critical',
      'warning': '🟠 Warning',
      'low': '🟡 Low'
    };
    return labels[status] || 'Unknown';
  };

  const handleReorder = (item) => {
    alert(`Reordering ${item.reorder_quantity} units of ${item.name}`);
    // In a real app, this would call an API to create a purchase order
  };

  const filteredItems = lowStockItems.filter(item => {
    const status = getStockStatus(item);
    if (filterType === 'all') return true;
    if (filterType === 'critical') return status === 'critical' || status === 'out-of-stock';
    if (filterType === 'warning') return status === 'warning' || status === 'low';
    return true;
  });

  if (loading) return (
    <AdminLayout title="Low Stock Alerts" description="Monitor inventory levels below reorder point">
      <SkeletonLoader type="content" rows={6} />
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout title="Low Stock Alerts" description="Monitor inventory levels below reorder point">
      <div className="error">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Low Stock Alerts" description="Monitor inventory levels below reorder point">
      <div className="inventory-container">
        <div className="inventory-header">
          <div>
            <h2>Low Stock Alerts</h2>
            <p className="total-alert">Total Items Below Reorder Level: <strong>{lowStockItems.length}</strong></p>
          </div>
          <div className="filter-buttons">
            <button 
              className={filterType === 'all' ? 'active' : ''} 
              onClick={() => setFilterType('all')}
            >
              All ({lowStockItems.length})
            </button>
            <button 
              className={filterType === 'critical' ? 'active' : ''} 
              onClick={() => setFilterType('critical')}
            >
              Critical
            </button>
            <button 
              className={filterType === 'warning' ? 'active' : ''} 
              onClick={() => setFilterType('warning')}
            >
              Warning
            </button>
          </div>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Reorder Qty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => {
                  const status = getStockStatus(item);
                  const percentage = (item.stock_quantity / item.reorder_level) * 100;
                  
                  return (
                    <tr key={item.id} className={`status-${status}`}>
                      <td>{item.sku}</td>
                      <td>
                        <div className="product-name">
                          <span>{item.image_url || '📦'}</span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>{item.category === 'accessory' ? 'Accessory' : 'Spare Part'}</td>
                      <td className={`stock-qty ${status}`}>
                        <strong>{item.stock_quantity}</strong>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                        </div>
                        <small>{percentage.toFixed(0)}% of reorder level</small>
                      </td>
                      <td>{item.reorder_level}</td>
                      <td>{item.reorder_quantity}</td>
                      <td className={`status-badge ${status}`}>
                        {getStatusLabel(status)}
                      </td>
                      <td className="actions">
                        <button className="reorder-btn" onClick={() => handleReorder(item)}>
                          Reorder {item.reorder_quantity}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="8" className="no-data">No low stock items found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <style>{`
          .filter-buttons {
            display: flex;
            gap: 0.5rem;
          }

          .filter-buttons button {
            padding: 0.5rem 1rem;
            border: 2px solid #ddd;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
          }

          .filter-buttons button.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
          }

          .filter-buttons button:hover {
            border-color: #667eea;
          }

          .product-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .stock-qty {
            text-align: center;
          }

          .stock-qty strong {
            display: block;
            font-size: 1.2rem;
          }

          .progress-bar {
            width: 100%;
            height: 4px;
            background: #eee;
            border-radius: 2px;
            margin: 0.25rem 0;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s;
          }

          .stock-qty.critical .progress-fill {
            background: linear-gradient(90deg, #f56565, #c53030);
          }

          .stock-qty.warning .progress-fill {
            background: linear-gradient(90deg, #ed8936, #dd6b20);
          }

          .stock-qty small {
            display: block;
            font-size: 0.75rem;
            color: #666;
          }

          .status-badge {
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-align: center;
          }

          .status-badge.critical {
            background: #fed7d7;
            color: #c53030;
          }

          .status-badge.warning {
            background: #feebc8;
            color: #c05621;
          }

          .status-badge.low {
            background: #fef5e7;
            color: #d68910;
          }

          tr.status-critical {
            background: #fff5f5;
          }

          tr.status-warning {
            background: #fffaf0;
          }

          .reorder-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }

          .reorder-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .total-alert {
            color: #667eea;
            font-size: 0.95rem;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default LowStockAlerts;
