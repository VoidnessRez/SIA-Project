import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import './StockRelease.css';

const BACKEND_URL = 'http://localhost:5174';

const StockRelease = () => {
  const [releases, setReleases] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  
  // Form states
  const [productType, setProductType] = useState('spare_part');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    releaseType: 'damage',
    releaseReason: '',
    releasedTo: '',
    destination: '',
    notes: ''
  });

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${BACKEND_URL}/api/stock-releases?limit=50`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (filterType !== 'all') url += `&release_type=${filterType}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setReleases(data.data || []);
      } else {
        setError('Failed to fetch stock releases');
      }
    } catch (err) {
      console.error('Error fetching releases:', err);
      setError('Failed to load stock releases. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stock-releases/stats`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.stats);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  useEffect(() => {
    fetchReleases();
    fetchStatistics();
  }, [fetchReleases, fetchStatistics]);

  useEffect(() => {
    if (showCreateModal) {
      fetchProducts(productType);
    }
  }, [productType, showCreateModal]);

  const fetchProducts = async (type) => {
    try {
      const endpoint = type === 'spare_part' ? 'spare-parts' : 'accessories';
      const response = await fetch(`${BACKEND_URL}/api/inventory/${endpoint}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleCreateRelease = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !formData.quantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/stock-releases/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: productType,
          product_id: selectedProduct.id,
          quantity_released: parseInt(formData.quantity) || 0,
          release_type: formData.releaseType,
          release_reason: formData.releaseReason,
          released_to: formData.releasedTo,
          destination: formData.destination,
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Stock release created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchReleases();
        fetchStatistics();
      } else {
        alert(data.error || 'Failed to create stock release');
      }
    } catch (err) {
      console.error('Error creating release:', err);
      alert('Failed to create stock release');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve this stock release?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/stock-releases/${id}/approve`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        alert('Stock release approved!');
        fetchReleases();
        fetchStatistics();
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Failed to approve stock release');
    }
  };

  const handleRelease = async (id) => {
    if (!confirm('Process this stock release? This will deduct inventory.')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/stock-releases/${id}/release`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        alert('Stock released successfully! Inventory updated.');
        fetchReleases();
        fetchStatistics();
      } else {
        alert(data.error || 'Failed to release stock');
      }
    } catch (err) {
      console.error('Error releasing:', err);
      alert('Failed to release stock');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this stock release?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/stock-releases/${id}/cancel`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (data.success) {
        alert('Stock release cancelled');
        fetchReleases();
        fetchStatistics();
      } else {
        alert(data.error || 'Failed to cancel');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      alert('Failed to cancel stock release');
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      quantity: '',
      releaseType: 'damage',
      releaseReason: '',
      releasedTo: '',
      destination: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'status-pending', text: 'Pending' },
      approved: { class: 'status-approved', text: 'Approved' },
      released: { class: 'status-released', text: 'Released' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };
    return badges[status] || { class: '', text: status };
  };

  const getTypeBadge = (type) => {
    const types = {
      damage: '🔴 Damage',
      return_to_supplier: '↩️ Return',
      internal_use: '🏢 Internal',
      sample: '📦 Sample',
      transfer: '🔄 Transfer'
    };
    return types[type] || type;
  };

  if (loading && releases.length === 0) {
    return (
      <AdminLayout title="Stock Release" description="Loading...">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading stock releases...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Stock Release Management" 
      description="Track and manage inventory releases"
    >
      <div className="stock-release-container">
        {/* Header with Create Button */}
        <div className="release-header">
          <div className="header-left">
            <h2>📤 Stock Release Log</h2>
            <p>Manage damage, returns, samples, and other inventory releases</p>
          </div>
          <button 
            className="btn-create-release"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ New Release Request
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="stats-grid">
            <div className="stat-card stat-pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-details">
                <h3>{statistics.pending || 0}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
            <div className="stat-card stat-approved">
              <div className="stat-icon">✅</div>
              <div className="stat-details">
                <h3>{statistics.approved || 0}</h3>
                <p>Approved</p>
              </div>
            </div>
            <div className="stat-card stat-released">
              <div className="stat-icon">📤</div>
              <div className="stat-details">
                <h3>{statistics.released || 0}</h3>
                <p>Released</p>
              </div>
            </div>
            <div className="stat-card stat-total">
              <div className="stat-icon">📊</div>
              <div className="stat-details">
                <h3>{statistics.total_quantity || 0}</h3>
                <p>Total Units Released</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Release Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="damage">Damage</option>
              <option value="return_to_supplier">Return to Supplier</option>
              <option value="internal_use">Internal Use</option>
              <option value="sample">Sample</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <button 
            className="btn-refresh"
            onClick={fetchReleases}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={fetchReleases}>Try Again</button>
          </div>
        )}

        {/* Releases Table */}
        <div className="releases-table-container">
          {releases.length === 0 ? (
            <div className="no-data">
              <span className="no-data-icon">📭</span>
              <h3>No Stock Releases Found</h3>
              <p>Click "New Release Request" to create one</p>
            </div>
          ) : (
            <table className="releases-table">
              <thead>
                <tr>
                  <th>Release #</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Type</th>
                  <th>Released To</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.id}>
                    <td className="release-number">{release.release_number}</td>
                    <td>
                      <div className="product-cell">
                        <strong>{release.product_name}</strong>
                        <span className="product-sku">{release.product_sku}</span>
                      </div>
                    </td>
                    <td className="quantity-cell">{release.quantity_released} units</td>
                    <td>
                      <span className="type-badge">
                        {getTypeBadge(release.release_type)}
                      </span>
                    </td>
                    <td>{release.released_to || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(release.status).class}`}>
                        {getStatusBadge(release.status).text}
                      </span>
                    </td>
                    <td>{new Date(release.requested_at).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      {release.status === 'pending' && (
                        <>
                          <button 
                            className="btn-action btn-approve"
                            onClick={() => handleApprove(release.id)}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-action btn-cancel"
                            onClick={() => handleCancel(release.id)}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {release.status === 'approved' && (
                        <button 
                          className="btn-action btn-release"
                          onClick={() => handleRelease(release.id)}
                          title="Release Stock"
                        >
                          📤
                        </button>
                      )}
                      <button 
                        className="btn-action btn-view"
                        onClick={() => setSelectedRelease(release)}
                        title="View Details"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📤 Create Stock Release Request</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRelease} className="release-form">
                <div className="form-group">
                  <label>Product Type *</label>
                  <select 
                    value={productType}
                    onChange={(e) => {
                      setProductType(e.target.value);
                      setSelectedProduct(null);
                    }}
                    className="form-control"
                  >
                    <option value="spare_part">Spare Part</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Product *</label>
                  <select 
                    value={selectedProduct?.id || ''}
                    onChange={(e) => {
                      const product = products.find(p => p.id === parseInt(e.target.value));
                      setSelectedProduct(product);
                    }}
                    className="form-control"
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock: {product.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity to Release *</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="form-control"
                    min="1"
                    max={selectedProduct?.stock_quantity || 999}
                    required
                  />
                  {selectedProduct && (
                    <small>Available: {selectedProduct.stock_quantity} units</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Release Type *</label>
                  <select 
                    value={formData.releaseType}
                    onChange={(e) => setFormData({...formData, releaseType: e.target.value})}
                    className="form-control"
                  >
                    <option value="damage">Damage/Defective</option>
                    <option value="return_to_supplier">Return to Supplier</option>
                    <option value="internal_use">Internal Use</option>
                    <option value="sample">Sample</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Release Reason *</label>
                  <textarea 
                    value={formData.releaseReason}
                    onChange={(e) => setFormData({...formData, releaseReason: e.target.value})}
                    className="form-control"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Released To</label>
                  <input 
                    type="text"
                    value={formData.releasedTo}
                    onChange={(e) => setFormData({...formData, releasedTo: e.target.value})}
                    className="form-control"
                    placeholder="Department, person, or location"
                  />
                </div>

                <div className="form-group">
                  <label>Destination</label>
                  <input 
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="form-control"
                    placeholder="Physical location or purpose"
                  />
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-control"
                    rows="2"
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Release Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedRelease && (
          <div className="modal-overlay" onClick={() => setSelectedRelease(null)}>
            <div className="modal-content modal-view" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📋 Release Details</h3>
                <button 
                  className="modal-close"
                  onClick={() => setSelectedRelease(null)}
                >
                  ✕
                </button>
              </div>

              <div className="release-details">
                <div className="detail-row">
                  <span className="detail-label">Release Number:</span>
                  <span className="detail-value">{selectedRelease.release_number}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{selectedRelease.product_name} ({selectedRelease.product_sku})</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{selectedRelease.quantity_released} units</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{getTypeBadge(selectedRelease.release_type)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${getStatusBadge(selectedRelease.status).class}`}>
                    {getStatusBadge(selectedRelease.status).text}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value">{selectedRelease.release_reason}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Released To:</span>
                  <span className="detail-value">{selectedRelease.released_to || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Destination:</span>
                  <span className="detail-value">{selectedRelease.destination || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Requested:</span>
                  <span className="detail-value">{new Date(selectedRelease.requested_at).toLocaleString()}</span>
                </div>
                {selectedRelease.approved_at && (
                  <div className="detail-row">
                    <span className="detail-label">Approved:</span>
                    <span className="detail-value">{new Date(selectedRelease.approved_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedRelease.released_at && (
                  <div className="detail-row">
                    <span className="detail-label">Released:</span>
                    <span className="detail-value">{new Date(selectedRelease.released_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedRelease.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedRelease.notes}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-primary"
                  onClick={() => setSelectedRelease(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StockRelease;
