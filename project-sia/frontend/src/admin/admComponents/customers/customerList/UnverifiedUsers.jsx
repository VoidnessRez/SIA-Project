import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './UnverifiedUsers.css';

const UnverifiedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name

  useEffect(() => {
    fetchUnverifiedUsers();
  }, [sortBy]);

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: sortBy === 'oldest' });

      if (sortBy === 'name') {
        query = query.order('full_name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);

    } catch (error) {
      console.error('Error fetching unverified users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    if (!confirm('Verify this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      if (error) throw error;

      // alert('User verified successfully!');
      fetchUnverifiedUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      // alert('Failed to verify user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // alert('User deleted successfully!');
      fetchUnverifiedUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      // alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <AdminLayout title="Unverified Users" description="Manage pending user verifications">
        <div className="unverified-users-container">
          <div className="users-summary">
            {[1, 2, 3].map(i => (
              <div key={i} className="summary-card inventory-skeleton-card">
                <div className="skeleton-title"></div>
                <div className="skeleton-value"></div>
              </div>
            ))}
          </div>
          <SkeletonLoader type="table" rows={8} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Unverified Users" description="Manage pending user verifications">
      <div className="unverified-users-container">
        {/* Summary Stats */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="users-summary">
            <div className="summary-card">
              <div className="summary-label">Total Unverified</div>
              <div className="summary-value">{users.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Pending Today</div>
              <div className="summary-value">
                {users.filter(u => {
                  const today = new Date().toDateString();
                  return new Date(u.created_at).toDateString() === today;
                }).length}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Filtered Results</div>
              <div className="summary-value">{filteredUsers.length}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        {!loading && (
          <div className="users-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="users-table-container">
          {loading ? (
            <SkeletonLoader />
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>{searchTerm ? 'No users match your search' : 'No unverified users found'}</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="user-name">{user.full_name || 'N/A'}</td>
                    <td className="user-email">{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <div className="address-info">
                        {user.address_line ? (
                          <>
                            <div>{user.address_line}</div>
                            <div className="address-details">
                              {user.barangay}, {user.city}
                            </div>
                          </>
                        ) : (
                          <span className="no-address">No address</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="action-btn verify-btn"
                          onClick={() => handleVerifyUser(user.id)}
                        >
                          ✓ Verify
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          ✗ Delete
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
        <div className="users-footer">
          <p>Showing {filteredUsers.length} of {users.length} unverified user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UnverifiedUsers;
