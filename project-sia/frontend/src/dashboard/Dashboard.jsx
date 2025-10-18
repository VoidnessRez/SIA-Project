import React from 'react';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';
import StatsSection from '../components/StatsSection';
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