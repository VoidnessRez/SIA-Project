import React from 'react';
import './StatsSection.css';

const StatsSection = () => {
  const stats = [
    { label: 'Available Products', value: '500+', icon: '🏍️', color: '#ff6b35' },
    { label: 'Happy Customers', value: '1,200+', icon: '😊', color: '#5cb85c' },
    { label: 'Brands Available', value: '4', icon: '🏷️', color: '#5bc0de' },
    { label: 'Years in Business', value: '10+', icon: '⭐', color: '#f7b801' },
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <h2>Why Choose Mejia Spareparts?</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card" style={{'--accent-color': stat.color}}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;