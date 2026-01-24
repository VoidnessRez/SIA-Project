import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './VerifiedUsers.css';

function VerifiedUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name

  // Fetch verified users
  const fetchVerifiedUsers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', true);

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name':
          query = query.order('full_name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching verified users:', error);
      // alert('Failed to load verified users');
    } finally {
      setLoading(false);
    }
  };

  // Unverify user
  const handleUnverifyUser = async (userId) => {
    if (!confirm('Are you sure you want to unverify this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);

      if (error) throw error;

      // alert('User unverified successfully');
      fetchVerifiedUsers();
    } catch (error) {
      console.error('Error unverifying user:', error);
      // alert('Failed to unverify user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // alert('User deleted successfully');
      fetchVerifiedUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      // alert('Failed to delete user');
    }
  };

  // Filter users based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm)
      );
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Fetch users on mount and when sort changes
  useEffect(() => {
    fetchVerifiedUsers();
  }, [sortBy]);

  // Calculate stats
  const totalVerified = users.length;
  const verifiedToday = users.filter(user => {
    const today = new Date();
    const created = new Date(user.created_at);
    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  }).length;
  const filteredCount = filteredUsers.length;

  return (
    <AdminLayout>
      <div className="verified-users-container">
        <h1>Verified Users</h1>

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="users-summary">
            <div className="summary-card">
              <div className="summary-label">Total Verified</div>
              <div className="summary-value">{totalVerified}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Verified Today</div>
              <div className="summary-value">{verifiedToday}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Showing Results</div>
              <div className="summary-value">{filteredCount}</div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
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
                <label>Sort By:</label>
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
              <p>No verified users found</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-name">{user.full_name || 'N/A'}</td>
                    <td className="user-email">{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      {user.address ? (
                        <div className="address-info">
                          <div>{user.address.street || 'No street'}</div>
                          <div className="address-details">
                            {user.address.barangay && `${user.address.barangay}, `}
                            {user.address.municipality || 'No municipality'} {user.address.province || ''}
                          </div>
                        </div>
                      ) : (
                        <span className="no-address">No address</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn unverify-btn"
                          onClick={() => handleUnverifyUser(user.id)}
                        >
                          Unverify
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
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
          <div className="users-footer">
            <p>Showing {filteredCount} of {totalVerified} verified users</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default VerifiedUsers;
