import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ children, title, description }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stickmanMode, setStickmanMode] = useState('walking'); 
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarNavRef = useRef(null);

  // Restore sidebar scroll position on mount
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('adminSidebarScroll');
    if (savedScrollPosition && sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = parseInt(savedScrollPosition, 10);
    }
  }, []);

  // Save sidebar scroll position whenever it changes
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarNavRef.current) {
        sessionStorage.setItem('adminSidebarScroll', sidebarNavRef.current.scrollTop.toString());
      }
    };

    const navElement = sidebarNavRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll);
      return () => navElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Change stickman mode with realistic timing
  useEffect(() => {
    const sequence = [
      { mode: 'walking', duration: 3000 },
      { mode: 'walking-fast', duration: 1000 },
      { mode: 'running', duration: 3000 },
      { mode: 'slowing', duration: 1000 },
      { mode: 'bike-approaching', duration: 1500 },
      { mode: 'mounting', duration: 2000 },
      { mode: 'riding', duration: 4000 }
    ];

    let currentIndex = 0;
    let timeoutId;

    const runSequence = () => {
      const current = sequence[currentIndex];
      setStickmanMode(current.mode);

      timeoutId = setTimeout(() => {
        currentIndex = (currentIndex + 1) % sequence.length;
        runSequence();
      }, current.duration);
    };

    runSequence();

    return () => clearTimeout(timeoutId);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      // second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
        { path: '/admin/delivers', icon: '', label: 'Restock management', badge: null },
        { path: '/admin/priceHistory', icon: '', label: 'Price History Overview', badge: null },
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
      section: 'USERS & REVIEWS',
      items: [
        { path: '/admin/unv_users', icon: '', label: 'Unverified Users', badge: null },
        { path: '/admin/ver_users', icon: '', label: 'Verified Users', badge: null },
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

        <nav className="admin-sidebar-nav" ref={sidebarNavRef}>
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
            <div className="admin-datetime">
              <div className={`walking-stickman mode-${stickmanMode}`}>
                {/* WALKING - Normal pace */}
                {stickmanMode === 'walking' && (
                  <svg width="40" height="40" viewBox="0 0 40 40" className="stickman-svg">
                    <circle cx="20" cy="8" r="4" fill="#10B981" className="stickman-head" />
                    <line x1="20" y1="12" x2="20" y2="22" stroke="#10B981" strokeWidth="2.5" className="stickman-body" />
                    <line x1="20" y1="15" x2="14" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-left" />
                    <line x1="20" y1="15" x2="26" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-right" />
                    <line x1="20" y1="22" x2="16" y2="32" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-left" />
                    <line x1="20" y1="22" x2="24" y2="32" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-right" />
                  </svg>
                )}
                
                {/* WALKING-FAST - Speeding up */}
                {stickmanMode === 'walking-fast' && (
                  <svg width="40" height="40" viewBox="0 0 40 40" className="stickman-svg">
                    <circle cx="20" cy="8" r="4" fill="#10B981" className="stickman-head" />
                    <line x1="20" y1="12" x2="20" y2="22" stroke="#10B981" strokeWidth="2.5" className="stickman-body" />
                    <line x1="20" y1="15" x2="14" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-left" />
                    <line x1="20" y1="15" x2="26" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-right" />
                    <line x1="20" y1="22" x2="16" y2="32" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-left" />
                    <line x1="20" y1="22" x2="24" y2="32" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-right" />
                  </svg>
                )}
                
                {/* RUNNING - Fast pace */}
                {stickmanMode === 'running' && (
                  <svg width="45" height="40" viewBox="0 0 45 40" className="stickman-svg running">
                    <circle cx="24" cy="7" r="4" fill="#10B981" className="stickman-head-run" />
                    <line x1="24" y1="11" x2="20" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-body-run" />
                    <line x1="22" y1="13" x2="15" y2="16" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-left-run" />
                    <line x1="22" y1="13" x2="30" y2="10" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-right-run" />
                    <line x1="20" y1="20" x2="14" y2="30" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-left-run" />
                    <line x1="20" y1="20" x2="28" y2="26" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-right-run" />
                  </svg>
                )}
                
                {/* SLOWING - Decelerating */}
                {stickmanMode === 'slowing' && (
                  <svg width="45" height="40" viewBox="0 0 45 40" className="stickman-svg running">
                    <circle cx="24" cy="7" r="4" fill="#10B981" className="stickman-head-run" />
                    <line x1="24" y1="11" x2="20" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-body-run" />
                    <line x1="22" y1="13" x2="15" y2="16" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-left-run" />
                    <line x1="22" y1="13" x2="30" y2="10" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-right-run" />
                    <line x1="20" y1="20" x2="14" y2="30" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-left-run" />
                    <line x1="20" y1="20" x2="28" y2="26" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-right-run" />
                  </svg>
                )}
                
                {/* BIKE APPROACHING - Standing still, bike coming */}
                {stickmanMode === 'bike-approaching' && (
                  <svg width="60" height="40" viewBox="0 0 60 40" className="stickman-svg bike-approach">
                    {/* Stickman standing */}
                    <circle cx="15" cy="8" r="4" fill="#10B981" className="stickman-head-wait" />
                    <line x1="15" y1="12" x2="15" y2="22" stroke="#10B981" strokeWidth="2.5" className="stickman-body-wait" />
                    <line x1="15" y1="15" x2="19" y2="18" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-wave" />
                    <line x1="15" y1="15" x2="11" y2="19" stroke="#10B981" strokeWidth="2.5" />
                    <line x1="15" y1="22" x2="13" y2="32" stroke="#10B981" strokeWidth="2.5" />
                    <line x1="15" y1="22" x2="17" y2="32" stroke="#10B981" strokeWidth="2.5" />
                    
                    {/* Motorcycle approaching from right */}
                    <circle cx="45" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" strokeOpacity="0.7" className="bike-wheel-approach-front" />
                    <circle cx="25" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" strokeOpacity="0.7" className="bike-wheel-approach-back" />
                    <line x1="25" y1="30" x2="45" y2="30" stroke="#10B981" strokeWidth="2.5" strokeOpacity="0.7" className="bike-frame-approach" />
                    <line x1="35" y1="20" x2="35" y2="30" stroke="#10B981" strokeWidth="2" strokeOpacity="0.7" />
                  </svg>
                )}
                
                {/* MOUNTING - Jumping onto bike */}
                {stickmanMode === 'mounting' && (
                  <svg width="55" height="40" viewBox="0 0 55 40" className="stickman-svg mounting">
                    <circle cx="18" cy="6" r="3.5" fill="#10B981" className="stickman-head-mount" />
                    <line x1="18" y1="9" x2="18" y2="16" stroke="#10B981" strokeWidth="2.5" className="stickman-body-mount" />
                    <line x1="18" y1="11" x2="24" y2="13" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-mount-reach" />
                    <line x1="18" y1="11" x2="13" y2="14" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-mount-left" />
                    <line x1="18" y1="16" x2="16" y2="22" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-mount-left" />
                    <line x1="18" y1="16" x2="22" y2="20" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-mount-right" />
                    
                    {/* Motorcycle */}
                    <circle cx="35" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" className="bike-wheel-front-mount" />
                    <circle cx="15" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" className="bike-wheel-back-mount" />
                    <line x1="15" y1="30" x2="35" y2="30" stroke="#10B981" strokeWidth="2.5" className="bike-frame-mount" />
                    <line x1="25" y1="20" x2="25" y2="30" stroke="#10B981" strokeWidth="2" className="bike-handle-mount" />
                  </svg>
                )}
                
                {/* RIDING - On motorcycle */}
                {stickmanMode === 'riding' && (
                  <svg width="55" height="40" viewBox="0 0 55 40" className="stickman-svg riding">
                    <circle cx="18" cy="8" r="3.5" fill="#10B981" className="stickman-head-ride" />
                    <line x1="18" y1="11" x2="18" y2="18" stroke="#10B981" strokeWidth="2.5" className="stickman-body-ride" />
                    <line x1="18" y1="13" x2="24" y2="15" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-ride-right" />
                    <line x1="18" y1="13" x2="13" y2="15" stroke="#10B981" strokeWidth="2.5" className="stickman-arm-ride-left" />
                    <line x1="18" y1="18" x2="15" y2="24" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-ride-left" />
                    <line x1="18" y1="18" x2="21" y2="24" stroke="#10B981" strokeWidth="2.5" className="stickman-leg-ride-right" />
                    
                    <circle cx="14" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" className="bike-wheel-front" />
                    <circle cx="34" cy="30" r="4" fill="none" stroke="#10B981" strokeWidth="2" className="bike-wheel-back" />
                    <line x1="14" y1="30" x2="34" y2="30" stroke="#10B981" strokeWidth="2.5" className="bike-frame" />
                    <line x1="24" y1="20" x2="24" y2="30" stroke="#10B981" strokeWidth="2" className="bike-handle" />
                    <line x1="24" y1="20" x2="28" y2="18" stroke="#10B981" strokeWidth="2" className="bike-handlebar" />
                  </svg>
                )}
              </div>
              <div className="datetime-content">
                <div className="admin-time">
                  <span className="time-icon"></span>
                  <span className="time-text">{formatTime(currentTime)}</span>
                </div>
                <div className="admin-date">
                  <span className="date-icon"></span>
                  <span className="date-text">{formatDate(currentTime)}</span>
                </div>
              </div>
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
