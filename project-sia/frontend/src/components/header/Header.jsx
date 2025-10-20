import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDarkMode } from '../../context/DarkModeContext.jsx';
import UserProfileDropdown from '../UserProfile/UserProfileDropdown.jsx';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  // Debug user data
  console.log('[Header] User data:', user);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo" onClick={handleNavClick}>
          <span className="logo-icon">🏍️</span>
          <div className="logo-text">
            <h2>Mejia Spareparts</h2>
            <p className="logo-subtitle">and Accessories</p>
          </div>
        </Link>
        
        <nav className={`nav-menu ${isMenuOpen ? 'nav-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </Link>
          <Link 
            to="/products" 
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📦</span>
            <span>Products</span>
          </Link>
          <Link 
            to="/brands" 
            className={`nav-link ${isActive('/brands') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">🏷️</span>
            <span>Brands</span>
          </Link>
          <Link 
            to="/orders" 
            className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📋</span>
            <span>Orders</span>
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📞</span>
            <span>Contact</span>
          </Link>
        </nav>

        <div className="header-actions">
          <div className="search-box">
            <input type="text" placeholder="Search products..." />
            <button className="search-btn">🔍</button>
          </div>
          
          {isAuthenticated() ? (
            <UserProfileDropdown 
              firstName={user?.first_name || ''}
              lastName={user?.last_name || ''}
              email={user?.email || ''}
              username={user?.username || 'Customer'}
              userRole="user" 
            />
          ) : (
            <>
              <button 
                className="dark-mode-toggle-btn"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button 
                className="login-btn-header"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
};

export default Header;