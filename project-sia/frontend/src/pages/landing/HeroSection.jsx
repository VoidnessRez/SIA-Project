import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1>Your Trusted Motorcycle Parts Supplier</h1>
          <p>Genuine spare parts and accessories for Honda, Suzuki, Yamaha, and Kawasaki motorcycles</p>
          <div className="hero-actions">
            <Link to="/products" className="cta-button primary">Browse All Products</Link>
            <Link to="/brands" className="cta-button secondary">Shop by Brand</Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-card">
            <div className="card-icon">🏍️</div>
            <h3>Genuine Parts</h3>
            <p>Quality motorcycle spare parts</p>
          </div>
          <div className="hero-card">
            <div className="card-icon">🛡️</div>
            <h3>Accessories</h3>
            <p>Wide range of bike accessories</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
