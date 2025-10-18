import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';
import StatsSection from '../components/StatsSection';
import FloatingCart from '../components/FloatingCart';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Header />
      <main className="main-content">
        <HeroSection />
        <StatsSection />
        <ProductGrid />
      </main>
      <FloatingCart itemCount={0} />
    </div>
  );
};

export default Dashboard;