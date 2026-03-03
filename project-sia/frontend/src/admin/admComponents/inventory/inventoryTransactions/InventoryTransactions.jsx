import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './InventoryTransactions.css';

const BACKEND_URL = 'http://localhost:5174';

const InventoryTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, incoming, outgoing
  const [filterProductType, setFilterProductType] = useState('all'); // all, spare_part, accessory
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalIncoming: 0,
    totalOutgoing: 0,
    incomingQuantity: 0,
    outgoingQuantity: 0
  });

  // Form states
  const [formData, setFormData] = useState({
    productType: 'spare_part',
    productId: '',
    productSku: '',
    productName: '',
    transactionType: 'incoming',
    quantity: '',
    transactionReason: 'purchase',
    referenceNumber: '',
    unitCost: '',
    notes: ''
  });

  const [products, setProducts] = useState([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${BACKEND_URL}/api/inventory/transactions?limit=100`;
      if (filterType !== 'all') url += `&transaction_type=${filterType}`;
      if (filterProductType !== 'all') url += `&product_type=${filterProductType}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const txns = data.data || [];
        setTransactions(txns);
        
        // Calculate stats
        const incoming = txns.filter(t => t.transaction_type === 'incoming');
        const outgoing = txns.filter(t => t.transaction_type === 'outgoing');
        
        setStats({
          totalIncoming: incoming.length,
          totalOutgoing: outgoing.length,
          incomingQuantity: incoming.reduce((sum, t) => sum + t.quantity, 0),
          outgoingQuantity: outgoing.reduce((sum, t) => sum + t.quantity, 0)
        });
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load inventory transactions. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterProductType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (showCreateModal) {
      fetchProducts(formData.productType);
    }
  }, [formData.productType, showCreateModal]);

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

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setFormData({
        ...formData,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        unitCost: product.cost_price || ''
      });
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();

    if (!formData.productId || !formData.quantity) {
      alert('Please select a product and enter quantity');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: formData.productType,
          product_id: formData.productId,
          product_sku: formData.productSku,
          product_name: formData.productName,
          transaction_type: formData.transactionType,
          quantity: parseInt(formData.quantity) || 0,
          transaction_reason: formData.transactionReason,
          reference_number: formData.referenceNumber,
          unit_cost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          total_cost: formData.unitCost ? parseFloat(formData.unitCost) * (parseInt(formData.quantity) || 0) : null,
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Transaction created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to create transaction');
      }
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Failed to create transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      productType: 'spare_part',
      productId: '',
      productSku: '',
      productName: '',
      transactionType: 'incoming',
      quantity: '',
      transactionReason: 'purchase',
      referenceNumber: '',
      unitCost: '',
      notes: ''
    });
  };

  const getTransactionIcon = (type) => {
    return type === 'incoming' ? '📥' : '📤';
  };

  const getTransactionClass = (type) => {
    return type === 'incoming' ? 'txn-incoming' : 'txn-outgoing';
  };

  const getReasonLabel = (reason) => {
    const labels = {
      purchase: '🛒 Purchase',
      sale: '💰 Sale',
      adjustment: '🔧 Adjustment',
      return: '↩️ Return',
      transfer: '🔄 Transfer',
      damage: '🔴 Damage',
      internal_use: '🏢 Internal'
    };
    return labels[reason] || reason;
  };

  if (loading && transactions.length === 0) {
    return (
      <AdminLayout title="Inventory Transactions" description="Loading transactions...">
        <SkeletonLoader type="full" rows={8} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Inventory Transactions" 
      description="Track all inventory movements"
    >
      <div className="transactions-container">
        {/* Header */}
        <div className="transactions-header">
          <div className="header-left">
            <h2>📊 Inventory Transactions Log</h2>
            <p>Complete history of all stock movements</p>
          </div>
          <button 
            className="btn-create-transaction"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Add Manual Transaction
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-incoming">
            <div className="stat-icon">📥</div>
            <div className="stat-details">
              <h3>{stats.totalIncoming}</h3>
              <p>Incoming Transactions</p>
              <span className="stat-subtitle">{stats.incomingQuantity} total units</span>
            </div>
          </div>
          <div className="stat-card stat-outgoing">
            <div className="stat-icon">📤</div>
            <div className="stat-details">
              <h3>{stats.totalOutgoing}</h3>
              <p>Outgoing Transactions</p>
              <span className="stat-subtitle">{stats.outgoingQuantity} total units</span>
            </div>
          </div>
          <div className="stat-card stat-total">
            <div className="stat-icon">📋</div>
            <div className="stat-details">
              <h3>{transactions.length}</h3>
              <p>Total Transactions</p>
              <span className="stat-subtitle">All time</span>
            </div>
          </div>
          <div className="stat-card stat-net">
            <div className="stat-icon">💹</div>
            <div className="stat-details">
              <h3>{stats.incomingQuantity - stats.outgoingQuantity}</h3>
              <p>Net Movement</p>
              <span className="stat-subtitle">
                {stats.incomingQuantity - stats.outgoingQuantity >= 0 ? '📈 Positive' : '📉 Negative'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Transaction Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Transactions</option>
              <option value="incoming">📥 Incoming</option>
              <option value="outgoing">📤 Outgoing</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Product Type:</label>
            <select 
              value={filterProductType} 
              onChange={(e) => setFilterProductType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Products</option>
              <option value="spare_part">Spare Parts</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>

          <button 
            className="btn-refresh"
            onClick={fetchTransactions}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={fetchTransactions}>Try Again</button>
          </div>
        )}

        {/* Transactions Table */}
        <div className="transactions-table-container">
          {transactions.length === 0 ? (
            <div className="no-data">
              <span className="no-data-icon">📭</span>
              <h3>No Transactions Found</h3>
              <p>Start by adding a manual transaction</p>
            </div>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Reference</th>
                  <th>Cost</th>
                  <th>Stock Change</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className={getTransactionClass(txn.transaction_type)}>
                    <td className="date-cell">
                      {new Date(txn.created_at).toLocaleDateString()}
                      <span className="time-cell">
                        {new Date(txn.created_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td>
                      <span className={`type-badge ${getTransactionClass(txn.transaction_type)}`}>
                        {getTransactionIcon(txn.transaction_type)} {txn.transaction_type}
                      </span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <strong>{txn.product_name}</strong>
                        <span className="product-sku">{txn.product_sku}</span>
                      </div>
                    </td>
                    <td className="quantity-cell">
                      <span className={txn.transaction_type === 'incoming' ? 'qty-positive' : 'qty-negative'}>
                        {txn.transaction_type === 'incoming' ? '+' : '-'}{txn.quantity}
                      </span>
                    </td>
                    <td>
                      <span className="reason-badge">
                        {getReasonLabel(txn.transaction_reason)}
                      </span>
                    </td>
                    <td className="reference-cell">
                      {txn.reference_number || '-'}
                    </td>
                    <td className="cost-cell">
                      {txn.total_cost ? `₱${txn.total_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="stock-change-cell">
                      <span className="prev-qty">{txn.previous_quantity || 0}</span>
                      <span className="arrow">→</span>
                      <span className="new-qty">{txn.new_quantity || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Transaction Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📝 Add Manual Transaction</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="transaction-form">
                <div className="form-group">
                  <label>Transaction Type *</label>
                  <select 
                    value={formData.transactionType}
                    onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                    className="form-control"
                  >
                    <option value="incoming">📥 Incoming (Stock In)</option>
                    <option value="outgoing">📤 Outgoing (Stock Out)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Product Type *</label>
                  <select 
                    value={formData.productType}
                    onChange={(e) => {
                      setFormData({...formData, productType: e.target.value, productId: '', productSku: '', productName: ''});
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
                    value={formData.productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
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
                  <label>Quantity *</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="form-control"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Transaction Reason *</label>
                  <select 
                    value={formData.transactionReason}
                    onChange={(e) => setFormData({...formData, transactionReason: e.target.value})}
                    className="form-control"
                  >
                    {formData.transactionType === 'incoming' ? (
                      <>
                        <option value="purchase">🛒 Purchase/Delivery</option>
                        <option value="return">↩️ Customer Return</option>
                        <option value="adjustment">🔧 Stock Adjustment</option>
                        <option value="transfer">🔄 Transfer In</option>
                      </>
                    ) : (
                      <>
                        <option value="sale">💰 Sale</option>
                        <option value="internal_use">🏢 Internal Use</option>
                        <option value="damage">🔴 Damage/Loss</option>
                        <option value="adjustment">🔧 Stock Adjustment</option>
                        <option value="transfer">🔄 Transfer Out</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Reference Number</label>
                  <input 
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                    className="form-control"
                    placeholder="PO-1234, ORD-5678, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Unit Cost (₱)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                    className="form-control"
                    placeholder="0.00"
                  />
                  {formData.quantity && formData.unitCost && (
                    <small>Total Cost: ₱{(parseFloat(formData.unitCost) * parseInt(formData.quantity)).toFixed(2)}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="Additional details..."
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
                    Create Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default InventoryTransactions;
