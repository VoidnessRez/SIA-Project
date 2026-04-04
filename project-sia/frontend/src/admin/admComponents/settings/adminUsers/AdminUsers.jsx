import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../../inventory/SkeletonLoader.jsx';
import './AdminUsers.css';

const BACKEND_URL = 'http://localhost:5174';

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/admin-users`);
      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        setAdminUsers([]);
        setFilteredUsers([]);
        return;
      }

      setAdminUsers(result.data);
      setFilteredUsers(result.data);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setAdminUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = adminUsers;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, adminUsers]);

  const handleDeleteAdmin = (userId) => {
    if (confirm('Are you sure you want to delete this admin user?')) {
      console.log('Deleting admin:', userId);
      // alert('Admin user deleted successfully!');
    }
  };

  const handleToggleStatus = (userId) => {
    console.log('Toggling status for user:', userId);
    // alert('User status updated!');
  };

  // Calculate stats
  const totalAdmins = adminUsers.length;
  const activeAdmins = adminUsers.filter(u => u.status === 'active').length;
  const superAdmins = adminUsers.filter(u => u.role === 'Super Admin').length;
  const filteredCount = filteredUsers.length;

  return (
    <AdminLayout title="Admin Users" description="Manage administrator accounts and permissions">
      <div className="admin-users-container">
        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="admin-summary">
            <div className="summary-card">
              <div className="summary-label">Total Admins</div>
              <div className="summary-value">{totalAdmins}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Active</div>
              <div className="summary-value success">{activeAdmins}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Super Admins</div>
              <div className="summary-value">{superAdmins}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Showing Results</div>
              <div className="summary-value">{filteredCount}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="admin-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Role:</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <button className="add-admin-btn">
                + Add New Admin
              </button>
            </div>
          </div>
        )}

        {/* Admin Users Table */}
        <div className="admin-table-container">
          {loading ? (
            <SkeletonLoader />
          ) : filteredUsers.length === 0 ? (
            <div className="no-admins">
              <p>No admin users found</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="admin-name">
                      <div className="user-avatar">{user.name[0]}</div>
                      {user.name}
                    </td>
                    <td className="admin-email">{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase().replace(' ', '-')}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn edit-btn"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn toggle-btn"
                          onClick={() => handleToggleStatus(user.id)}
                          title="Toggle Status"
                        >
                          {user.status === 'active' ? '🔒' : '🔓'}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteAdmin(user.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
