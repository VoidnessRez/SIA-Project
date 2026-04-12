import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../../inventory/SkeletonLoader.jsx';
import './UserOverview.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const UserOverview = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUserOverview();
  }, []);

  const fetchUserOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/users/overview`);
      const result = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      setUsers(result.data);
      setFilteredUsers(result.data);
    } catch (error) {
      console.error('Error fetching user overview:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  // Calculate stats
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.status === 'verified').length;
  const unverifiedUsers = users.filter(u => u.status === 'unverified').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;
  const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);
  const filteredCount = filteredUsers.length;

  return (
    <AdminLayout title="User Overview" description="Complete customer database and insights">
      <div className="user-overview-container">
        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="overview-summary">
            <div className="summary-card">
              <div className="summary-label">Total Users</div>
              <div className="summary-value">{totalUsers}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Verified</div>
              <div className="summary-value success">{verifiedUsers}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Unverified</div>
              <div className="summary-value warning">{unverifiedUsers}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Blocked</div>
              <div className="summary-value danger">{blockedUsers}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value">₱{totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="overview-controls">
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
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* User Overview Table */}
        <div className="overview-table-container">
          {loading ? (
            <SkeletonLoader />
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No users found</p>
            </div>
          ) : (
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-info">
                      <div className="user-avatar">{user.name[0]}</div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-id">ID: #{user.id}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div>{user.email}</div>
                        <div className="phone">{user.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="orders-count">{user.totalOrders}</td>
                    <td className="total-spent">₱{user.totalSpent.toLocaleString()}</td>
                    <td>{user.lastOrder ? new Date(user.lastOrder).toLocaleDateString() : 'No orders'}</td>
                    <td>{new Date(user.registered).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button className="action-btn view-btn" title="View Details">
                          👁️
                        </button>
                        <button className="action-btn edit-btn" title="Edit">
                          ✏️
                        </button>
                        <button className="action-btn delete-btn" title="Delete">
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

        {/* Showing count */}
        {!loading && (
          <div className="table-footer">
            <p>Showing {filteredCount} of {totalUsers} users</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserOverview;
