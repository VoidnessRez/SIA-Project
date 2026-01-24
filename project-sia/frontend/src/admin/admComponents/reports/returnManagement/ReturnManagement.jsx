import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './ReturnManagement.css';

function ReturnManagement() {
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [reasonFilter, setReasonFilter] = useState('all'); // all, defective, wrong-item, changed-mind, other

  // Fetch return requests
  const fetchReturns = async () => {
    try {
      setLoading(true);

      // Fetch return requests with order and product details
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          orders(*, profiles(full_name, email)),
          order_items(*, products(name, image_url))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReturns(data || []);
      setFilteredReturns(data || []);
    } catch (error) {
      console.error('Error fetching returns:', error);
      // alert('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  // Approve return
  const handleApproveReturn = async (returnId) => {
    if (!confirm('Approve this return request?')) return;

    try {
      const { error } = await supabase
        .from('return_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', returnId);

      if (error) throw error;

      // alert('Return request approved');
      fetchReturns();
    } catch (error) {
      console.error('Error approving return:', error);
      // alert('Failed to approve return');
    }
  };

  // Reject return
  const handleRejectReturn = async (returnId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('return_requests')
        .update({ 
          status: 'rejected', 
          rejection_reason: reason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', returnId);

      if (error) throw error;

      // alert('Return request rejected');
      fetchReturns();
    } catch (error) {
      console.error('Error rejecting return:', error);
      // alert('Failed to reject return');
    }
  };

  // Delete return
  const handleDeleteReturn = async (returnId) => {
    if (!confirm('Delete this return request? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('return_requests')
        .delete()
        .eq('id', returnId);

      if (error) throw error;

      // alert('Return request deleted');
      fetchReturns();
    } catch (error) {
      console.error('Error deleting return:', error);
      // alert('Failed to delete return');
    }
  };

  // Filter returns
  useEffect(() => {
    let filtered = returns;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ret => {
        const orderId = ret.order_id?.toString() || '';
        const customerName = ret.orders?.profiles?.full_name?.toLowerCase() || '';
        const productName = ret.order_items?.products?.name?.toLowerCase() || '';
        return orderId.includes(searchLower) || customerName.includes(searchLower) || productName.includes(searchLower);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ret => ret.status === statusFilter);
    }

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(ret => ret.reason === reasonFilter);
    }

    setFilteredReturns(filtered);
  }, [searchTerm, statusFilter, reasonFilter, returns]);

  useEffect(() => {
    fetchReturns();
  }, []);

  // Calculate stats
  const totalReturns = returns.length;
  const pendingReturns = returns.filter(r => r.status === 'pending').length;
  const approvedReturns = returns.filter(r => r.status === 'approved').length;
  const rejectedReturns = returns.filter(r => r.status === 'rejected').length;
  const filteredCount = filteredReturns.length;

  return (
    <AdminLayout>
      <div className="return-management-container">
        <h1>Return Management</h1>

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="returns-summary">
            <div className="summary-card">
              <div className="summary-label">Total Returns</div>
              <div className="summary-value">{totalReturns}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Pending</div>
              <div className="summary-value warning">{pendingReturns}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Approved</div>
              <div className="summary-value success">{approvedReturns}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Rejected</div>
              <div className="summary-value danger">{rejectedReturns}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="returns-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by order ID, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Reason:</label>
                <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
                  <option value="all">All Reasons</option>
                  <option value="defective">Defective</option>
                  <option value="wrong-item">Wrong Item</option>
                  <option value="changed-mind">Changed Mind</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Returns Table */}
        <div className="returns-table-container">
          {loading ? (
            <SkeletonLoader />
          ) : filteredReturns.length === 0 ? (
            <div className="no-returns">
              <p>No return requests found</p>
            </div>
          ) : (
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Details</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((returnReq) => (
                  <tr key={returnReq.id}>
                    <td className="order-id">#{returnReq.order_id}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{returnReq.orders?.profiles?.full_name || 'N/A'}</div>
                        <div className="customer-email">{returnReq.orders?.profiles?.email || ''}</div>
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        {returnReq.order_items?.products?.image_url && (
                          <img src={returnReq.order_items.products.image_url} alt="" className="product-thumb" />
                        )}
                        <span>{returnReq.order_items?.products?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="reason">{returnReq.reason || 'N/A'}</td>
                    <td className="details">{returnReq.details || 'No details'}</td>
                    <td>{new Date(returnReq.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${returnReq.status}`}>
                        {returnReq.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {returnReq.status === 'pending' && (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproveReturn(returnReq.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleRejectReturn(returnReq.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteReturn(returnReq.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="returns-footer">
            <p>Showing {filteredCount} of {totalReturns} return requests</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ReturnManagement;
