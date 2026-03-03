import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../AdminAuth/layout/AdminLayout';
import './PriceHistory.css';

const BACKEND_URL = 'http://localhost:5174';

const PriceHistory = () => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterType, setFilterType] = useState('all'); // all, spare_part, accessory
  const [filterChange, setFilterChange] = useState('all'); // all, increase, decrease
  const [dateRange, setDateRange] = useState('30'); // days
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPriceHistory();
    fetchStatistics();
  }, [filterType, filterChange, dateRange]);

  const fetchPriceHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${BACKEND_URL}/api/price-history?limit=100`;
      
      if (filterType !== 'all') url += `&product_type=${filterType}`;
      if (filterChange !== 'all') url += `&change_type=${filterChange}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPriceHistory(data.data || []);
      } else {
        setError('Failed to fetch price history');
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Failed to load price history. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/price-history/stats?days=${dateRange}`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.stats);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (percent) => {
    const value = parseFloat(percent);
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChangeIcon = (changeType) => {
    return changeType === 'increase' ? '📈' : '📉';
  };

  const getChangeClass = (changeType) => {
    return changeType === 'increase' ? 'price-increase' : 'price-decrease';
  };

  const filteredHistory = priceHistory.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(search) ||
      item.product_sku?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="price-history-page">
        <div className="page-header">
          <div className="header-left">
            <h1>📊 Price History Overview</h1>
            <p>Track all price changes for spare parts and accessories</p>
          </div>
          <button className="btn-refresh" onClick={() => { fetchPriceHistory(); fetchStatistics(); }}>
            🔄 Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Total Changes ({statistics.days} days)</div>
                <div className="stat-value">{statistics.total_changes}</div>
              </div>
            </div>
            <div className="stat-card increase">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Price Increases</div>
                <div className="stat-value">{statistics.price_increases}</div>
                <div className="stat-subtext">Avg: {statistics.average_increase_percent}%</div>
              </div>
            </div>
            <div className="stat-card decrease">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <div className="stat-label">Price Decreases</div>
                <div className="stat-value">{statistics.price_decreases}</div>
                <div className="stat-subtext">Avg: {statistics.average_decrease_percent}%</div>
              </div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-label">Biggest Change</div>
                <div className="stat-value">
                  {Math.max(
                    Math.abs(statistics.max_increase_percent),
                    Math.abs(statistics.max_decrease_percent)
                  ).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-search"
            />
          </div>
          
          <div className="filter-group">
            <label>Product Type:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Products</option>
              <option value="spare_part">Spare Parts</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Change Type:</label>
            <select value={filterChange} onChange={(e) => setFilterChange(e.target.value)}>
              <option value="all">All Changes</option>
              <option value="increase">Increases Only</option>
              <option value="decrease">Decreases Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Time Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Price History Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading price history...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchPriceHistory} className="btn-retry">Try Again</button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Price Changes Found</h3>
              <p>No price history records match your filters.</p>
            </div>
          ) : (
            <table className="price-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Old Price</th>
                  <th>New Price</th>
                  <th>Change</th>
                  <th>Percentage</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className={getChangeClass(item.change_type)}>
                    <td className="date-cell">{formatDate(item.change_date)}</td>
                    <td className="product-cell">
                      <div className="product-name">{item.product_name}</div>
                    </td>
                    <td className="sku-cell">{item.product_sku}</td>
                    <td className="type-cell">
                      <span className={`type-badge ${item.product_type}`}>
                        {item.product_type === 'spare_part' ? '⚙️ Part' : '🛡️ Accessory'}
                      </span>
                    </td>
                    <td className="price-cell old-price">{formatCurrency(item.old_selling_price)}</td>
                    <td className="price-cell new-price">{formatCurrency(item.new_selling_price)}</td>
                    <td className={`change-cell ${item.change_type}`}>
                      {getChangeIcon(item.change_type)} {formatCurrency(Math.abs(item.price_difference))}
                    </td>
                    <td className={`percentage-cell ${item.change_type}`}>
                      {formatPercentage(item.percentage_change)}
                    </td>
                    <td className="reason-cell">
                      {item.change_reason || 'No reason specified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className="results-count">
            Showing {filteredHistory.length} of {priceHistory.length} price changes
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PriceHistory;
