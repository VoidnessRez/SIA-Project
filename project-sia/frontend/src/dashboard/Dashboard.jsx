import React from 'react';
import HeroSection from '../pages/landing/HeroSection';
import ProductGrid from '../pages/products/ProductGrid';
import StatsSection from '../pages/landing/StatsSection';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <main className="main-content">
        <HeroSection />
        <StatsSection />
        <ProductGrid />
      </main>
    </div>
  );
};

export default Dashboard;