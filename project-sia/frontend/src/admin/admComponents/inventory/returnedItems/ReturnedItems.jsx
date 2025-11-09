import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './ReturnedItems.css';

const BACKEND_URL = 'http://localhost:5174';

const ReturnedItems = () => {
  const [returnedItems, setReturnedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, refunded

  useEffect(() => {
    fetchReturnedItems();
  }, []);

  const fetchReturnedItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from transactions to get return data
      const [response] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/transactions`),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      const data = await response.json();
      
      if (data.success) {
        // Filter for return-related transactions
        const returns = (data.data || []).filter(t => t.transaction_type === 'return' || t.status === 'returned');
        setReturnedItems(returns);
      } else {
        setError('Failed to fetch returned items');
      }
    } catch (err) {
      console.error('Error fetching returned items:', err);
      setError('Failed to load returned items. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = (returnId) => {
    if (confirm('Approve this return request?')) {
      alert(`Return #${returnId} approved`);
      // Call API to update status and restock inventory
    }
  };

  const handleRejectReturn = (returnId) => {
    if (confirm('Reject this return request?')) {
      const reason = prompt('Reason for rejection:');
      if (reason) {
        alert(`Return #${returnId} rejected: ${reason}`);
        // Call API to update status
      }
    }
  };

  const handleProcessRefund = (returnId, amount) => {
    if (confirm(`Process refund of ₱${amount.toFixed(2)}?`)) {
      alert(`Refund processed for return #${returnId}`);
      // Call API to process refund
    }
  };

  const filteredReturns = returnedItems.filter(item => {
    if (filter === 'pending') return item.status === 'pending_approval' || item.status === 'returned';
    if (filter === 'approved') return item.status === 'approved';
    if (filter === 'rejected') return item.status === 'rejected';
    if (filter === 'refunded') return item.status === 'refunded';
    return true;
  });

  if (loading) return (
    <AdminLayout title="Returned Items" description="Manage product returns and refunds">
      <SkeletonLoader type="content" rows={6} />
    </AdminLayout>
  );

  return (
    <AdminLayout title="Returned Items" description="Manage product returns and refunds">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Returned Items Management</h2>
          <div className="filter-buttons">
            <button 
              className={filter === 'pending' ? 'active' : ''} 
              onClick={() => setFilter('pending')}
            >
              Pending Review
            </button>
            <button 
              className={filter === 'approved' ? 'active' : ''} 
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button 
              className={filter === 'rejected' ? 'active' : ''} 
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
            <button 
              className={filter === 'refunded' ? 'active' : ''} 
              onClick={() => setFilter('refunded')}
            >
              Refunded
            </button>
          </div>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Return Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length > 0 ? (
                filteredReturns.map(item => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>#{item.order_id || 'N/A'}</td>
                    <td>{item.customer_name || 'N/A'}</td>
                    <td>{item.product_name || item.notes || 'N/A'}</td>
                    <td>{item.return_reason || 'No reason provided'}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>₱{item.amount?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status || 'pending'}
                      </span>
                    </td>
                    <td className="actions">
                      {(item.status === 'pending_approval' || item.status === 'returned') && (
                        <>
                          <button className="approve-btn" onClick={() => handleApproveReturn(item.id)}>
                            Approve
                          </button>
                          <button className="reject-btn" onClick={() => handleRejectReturn(item.id)}>
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'approved' && (
                        <button className="refund-btn" onClick={() => handleProcessRefund(item.id, item.amount)}>
                          Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="no-data">No returned items found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <style>{`
          .approve-btn {
            background: #48bb78;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 0.5rem;
            font-weight: 600;
            transition: all 0.3s;
          }

          .approve-btn:hover {
            background: #38a169;
            transform: translateY(-2px);
          }

          .reject-btn {
            background: #f56565;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }

          .reject-btn:hover {
            background: #e53e3e;
            transform: translateY(-2px);
          }

          .refund-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
          }

          .refund-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .status-badge.pending_approval,
          .status-badge.returned {
            background: #fef5e7;
            color: #d68910;
          }

          .status-badge.approved {
            background: #d5f4e6;
            color: #0b5345;
          }

          .status-badge.rejected {
            background: #fadbd8;
            color: #c0392b;
          }

          .status-badge.refunded {
            background: #d6eaf8;
            color: #1f618d;
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default ReturnedItems;
