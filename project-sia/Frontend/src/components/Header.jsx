import React, { useState } from 'react';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');

  const handleNavClick = (linkName) => {
    setActiveLink(linkName);
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon">🏍️</span>
          <div className="logo-text">
            <h2>Mejia Spareparts</h2>
            <p className="logo-subtitle">and Accessories</p>
          </div>
        </div>
        
        <nav className={`nav-menu ${isMenuOpen ? 'nav-open' : ''}`}>
          <a 
            href="#dashboard" 
            className={`nav-link ${activeLink === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </a>
          <a 
            href="#products" 
            className={`nav-link ${activeLink === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('products')}
          >
            <span className="nav-icon">📦</span>
            <span>All Products</span>
          </a>
          <a 
            href="#brands" 
            className={`nav-link ${activeLink === 'brands' ? 'active' : ''}`}
            onClick={() => handleNavClick('brands')}
          >
            <span className="nav-icon">🏷️</span>
            <span>Brands</span>
          </a>
          <a 
            href="#my-orders" 
            className={`nav-link ${activeLink === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('orders')}
          >
            <span className="nav-icon">📋</span>
            <span>My Orders</span>
          </a>
          <a 
            href="#contact" 
            className={`nav-link ${activeLink === 'contact' ? 'active' : ''}`}
            onClick={() => handleNavClick('contact')}
          >
            <span className="nav-icon">📞</span>
            <span>Contact</span>
          </a>
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