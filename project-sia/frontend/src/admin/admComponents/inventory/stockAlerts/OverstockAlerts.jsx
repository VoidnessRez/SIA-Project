import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './OverstockAlerts.css';

const BACKEND_URL = 'http://localhost:5174';

const OverstockAlerts = () => {
  const [overstockedItems, setOverstockedItems] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, spare_part, accessory
  const [editingItem, setEditingItem] = useState(null);
  const [newMaxStock, setNewMaxStock] = useState('');

  useEffect(() => {
    fetchOverstockedItems();
    fetchStatistics();
  }, [filterType]);

  const fetchOverstockedItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${BACKEND_URL}/api/inventory/overstocked?limit=100`;
      if (filterType !== 'all') url += `&product_type=${filterType}`;

      const [response] = await Promise.all([
        fetch(url),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
      const data = await response.json();

      if (data.success) {
        setOverstockedItems(data.data || []);
      } else {
        setError('Failed to fetch overstocked items');
      }
    } catch (err) {
      console.error('Error fetching overstocked items:', err);
      setError('Failed to load overstock alerts. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/overstocked/stats`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.stats);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleUpdateMaxStock = async (item) => {
    if (!newMaxStock || newMaxStock <= 0) {
      alert('Please enter a valid maximum stock level');
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/inventory/update-max-stock/${item.product_type}/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_stock_level: parseInt(newMaxStock) })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Maximum stock level updated successfully');
        setEditingItem(null);
        setNewMaxStock('');
        fetchOverstockedItems();
        fetchStatistics();
      } else {
        alert('Failed to update maximum stock level');
      }
    } catch (err) {
      console.error('Error updating max stock:', err);
      alert('Failed to update maximum stock level');
    }
  };

  const getStatusLabel = (excessPercent) => {
    if (excessPercent >= 100) return { label: 'Critical Overstock', class: 'critical' };
    if (excessPercent >= 50) return { label: 'High Overstock', class: 'high' };
    if (excessPercent >= 25) return { label: 'Moderate Overstock', class: 'moderate' };
    return { label: 'Slight Overstock', class: 'slight' };
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  return (
    <AdminLayout>
      <div className="overstock-alerts-page">
        <div className="page-header">
          <div className="header-left">
            <h1>📦 Overstock Monitoring</h1>
            <p>Track items with excess inventory levels</p>
          </div>
          <button className="btn-refresh" onClick={() => { fetchOverstockedItems(); fetchStatistics(); }}>
            🔄 Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="stats-grid">
            <div className="stat-card warning">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <div className="stat-label">Overstocked Items</div>
                <div className="stat-value">{statistics.total_overstocked_items}</div>
                <div className="stat-subtext">
                  {statistics.overstock_rate}% of total inventory
                </div>
              </div>
            </div>
            <div className="stat-card danger">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Excess Units</div>
                <div className="stat-value">{statistics.total_excess_units.toLocaleString()}</div>
                <div className="stat-subtext">Units above max level</div>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Tied Up Capital</div>
                <div className="stat-value">{formatCurrency(statistics.total_excess_value)}</div>
                <div className="stat-subtext">Value of excess stock</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Type:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Products</option>
              <option value="spare_part">Spare Parts</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>
        </div>

        {/* Overstocked Items Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading overstocked items...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchOverstockedItems} className="btn-retry">Try Again</button>
            </div>
          ) : overstockedItems.length === 0 ? (
            <div className="empty-state success">
              <div className="empty-icon">✅</div>
              <h3>No Overstocked Items!</h3>
              <p>All inventory levels are within acceptable limits.</p>
            </div>
          ) : (
            <table className="overstock-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Current Stock</th>
                  <th>Max Level</th>
                  <th>Excess</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overstockedItems.map((item) => {
                  const status = getStatusLabel(parseFloat(item.excess_percentage));
                  return (
                    <tr key={`${item.product_type}-${item.id}`} className={`status-${status.class}`}>
                      <td className="product-cell">
                        <div className="product-info">
                          <strong>{item.name}</strong>
                          <small>{item.sparepart_brand?.name || item.accessory_brand?.name}</small>
                        </div>
                      </td>
                      <td className="sku-cell">{item.sku}</td>
                      <td className="type-cell">
                        <span className={`type-badge ${item.product_type}`}>
                          {item.product_type === 'spare_part' ? '⚙️ Part' : '🛡️ Accessory'}
                        </span>
                      </td>
                      <td className="stock-cell">
                        <strong>{item.stock_quantity}</strong> units
                      </td>
                      <td className="max-cell">{item.max_stock_level} units</td>
                      <td className="excess-cell">
                        <div className="excess-info">
                          <strong>+{item.excess_quantity}</strong> units
                          <small className="excess-percent">+{item.excess_percentage}%</small>
                        </div>
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {editingItem?.id === item.id && editingItem?.product_type === item.product_type ? (
                          <div className="edit-form">
                            <input
                              type="number"
                              value={newMaxStock}
                              onChange={(e) => setNewMaxStock(e.target.value)}
                              placeholder="New max"
                              min="1"
                            />
                            <button onClick={() => handleUpdateMaxStock(item)} className="btn-save">
                              ✓
                            </button>
                            <button onClick={() => { setEditingItem(null); setNewMaxStock(''); }} className="btn-cancel">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { 
                              setEditingItem(item); 
                              setNewMaxStock(item.max_stock_level); 
                            }} 
                            className="btn-edit"
                          >
                            ⚙️ Adjust Max
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Results Count */}
        {!loading && !error && overstockedItems.length > 0 && (
          <div className="results-count">
            Showing {overstockedItems.length} overstocked items
          </div>
        )}

        {/* Info Box */}
        <div className="info-box">
          <h4>💡 Overstock Management Tips</h4>
          <ul>
            <li>Review overstocked items regularly to prevent capital tie-up</li>
            <li>Consider running promotions or discounts on overstocked items</li>
            <li>Adjust max stock levels based on sales trends and demand</li>
            <li>Coordinate with suppliers to optimize order quantities</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OverstockAlerts;
