import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('all'); // all, pickup, delivery
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, completed, declined
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [filterMethod, filterStatus]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          status,
          fulfillment_method,
          payment_method,
          payment_status,
          user_id,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filterMethod !== 'all') {
        query = query.eq('fulfillment_method', filterMethod);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);

    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'completed':
        return 'status-completed';
      case 'declined':
      case 'cancelled':
        return 'status-declined';
      default:
        return 'status-pending';
    }
  };

  const getPaymentStatusBadgeClass = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
      case 'confirmed':
        return 'payment-confirmed';
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      default:
        return 'payment-pending';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.order_number?.toLowerCase().includes(searchLower) ||
      transaction.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      transaction.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0);
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const completedCount = filteredTransactions.filter(t => t.status === 'completed').length;

  if (loading) {
    return (
      <AdminLayout title="Transactions" description="Track all payment transactions">
        <div className="transactions-container">
          <div className="transactions-summary">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="summary-card inventory-skeleton-card">
                <div className="skeleton-icon" style={{ width: '70px', height: '70px', borderRadius: '14px', background: '#e0e0e0' }}></div>
                <div className="summary-info" style={{ flex: 1 }}>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-value"></div>
                </div>
              </div>
            ))}
          </div>
          <SkeletonLoader type="table" rows={10} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Transactions" description="Track all payment transactions">
      <div className="transactions-container">
        {/* Summary Stats */}
        <div className="transactions-summary">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <div className="summary-label">Total Transactions</div>
              <div className="summary-value">₱{totalAmount.toFixed(2)}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⏳</div>
            <div className="summary-info">
              <div className="summary-label">Pending</div>
              <div className="summary-value">{pendingCount}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-info">
              <div className="summary-label">Completed</div>
              <div className="summary-value">{completedCount}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <div className="summary-label">Total Orders</div>
              <div className="summary-value">{filteredTransactions.length}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="transactions-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Method:</label>
              <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="transactions-table-container">
          {filteredTransactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found</p>
            </div>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Method</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="order-number">{transaction.order_number}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">
                          {transaction.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="customer-email">
                          {transaction.profiles?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="datetime-info">
                        <div className="date">
                          {new Date(transaction.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="time">
                          {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`method-badge method-${transaction.fulfillment_method?.toLowerCase()}`}>
                        {transaction.fulfillment_method || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="payment-info">
                        <div className="payment-method">
                          {transaction.payment_method || 'COD'}
                        </div>
                        <span className={`payment-status ${getPaymentStatusBadgeClass(transaction.payment_status)}`}>
                          {transaction.payment_status || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                        {transaction.status || 'Pending'}
                      </span>
                    </td>
                    <td className="amount">₱{parseFloat(transaction.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Transaction Count */}
        <div className="transactions-footer">
          <p>Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Transactions;
