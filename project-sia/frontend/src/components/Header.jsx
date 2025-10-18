import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

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
          
          <div className="user-profile">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <span className="user-greeting">Welcome,</span>
              <span className="user-name">Customer</span>
            </div>
            <button className="logout-btn">Logout</button>
          </div>
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