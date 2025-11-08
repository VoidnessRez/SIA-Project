import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ children, title, description }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.removeItem('adminAuthed');
      navigate('/');
    }
  };

  const navItems = [
    {
      section: 'INVENTORY',
      items: [
        { path: '/admin/inventory', icon: '', label: 'Inventory Management', badge: null },
        { path: '/admin/spare-parts', icon: '', label: 'Spare Parts', badge: null },
        { path: '/admin/accessories', icon: '', label: 'Accessories', badge: null },
        { path: '/admin/low-stock', icon: '', label: 'Low Stock Alerts', badge: '5' },
        { path: '/admin/brands', icon: '', label: 'Brands Management', badge: null },
        { path: '/admin/pickup', icon: '', label: 'Item Pickup', badge: null },
        { path: '/admin/returnModule', icon: '', label: 'Returned Items', badge: null },
      ]
    },
    {
      section: 'ORDERS & SALES',
      items: [
        { path: '/admin/orders', icon: '', label: 'Customer Orders', badge: '12' },
        { path: '/admin/sales', icon: '', label: 'Sales Records', badge: null },
        { path: '/admin/transactions', icon: '', label: 'Transactions', badge: null },
      ]
    },
    {
      section: 'CUSTOMERS',
      items: [
        { path: '/admin/customers', icon: '', label: 'Customer List', badge: null },
        { path: '/admin/reviews', icon: '', label: 'Reviews & Ratings', badge: '3' },
      ]
    },
    {
      section: 'REPORTS',
      items: [
        { path: '/admin/reports/sales', icon: '', label: 'Sales Reports', badge: null },
        { path: '/admin/reports/inventory', icon: '', label: 'Inventory Reports', badge: null },
        { path: '/admin/reports/analytics', icon: '', label: 'Analytics', badge: null },
        { path: '/admin/modules', icon: '', label: 'Return Management', badge: null },
        { path: '/admin/feedbacks', icon: '', label: 'Feedback', badge: null },
        { path: '/admin/messages', icon: '', label: 'Messages', badge: null },
      ]
    },
    {
      section: 'SETTINGS',
      items: [
        { path: '/admin/settings', icon: '', label: 'System Settings', badge: null },
        { path: '/admin/adminUsers', icon: '', label: 'Admin Users', badge: null },
        { path: '/admin/customer', icon: '', label: 'User Overview', badge: null },
      ]
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          {/* <div className="admin-sidebar-logo">🏍️</div> */}
          <div className="admin-sidebar-title">
            <h2>Mejia Admin</h2>
            <p>Management Panel</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((section, idx) => (
            <div key={idx} className="admin-nav-section">
              <div className="admin-nav-section-title">{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-nav-item-icon">{item.icon}</span>
                  <span className="admin-nav-item-text">{item.label}</span>
                  {item.badge && (
                    <span className="admin-nav-item-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">A</div>
            <div className="admin-user-details">
              <h4>Admin User</h4>
              <p>Administrator</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
            <div className="admin-topbar-title">
              <h1>{title || 'Dashboard'}</h1>
              <p>{description || 'Manage your business operations'}</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-search">
              <span className="admin-search-icon">🔍</span>
              <input type="text" placeholder="Search..." />
            </div>
            <button className="admin-notifications">
              🔔
              <span className="badge">5</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
