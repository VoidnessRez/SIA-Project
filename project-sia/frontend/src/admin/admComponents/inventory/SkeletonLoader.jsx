import React from 'react';
import './Shared.css';

const SkeletonLoader = ({ type = 'table', rows = 5 }) => {
  if (type === 'stats') {
    return (
      <div className="inventory-stats-grid">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="inventory-stat-card inventory-skeleton-card">
            <div className="skeleton-title"></div>
            <div className="skeleton-value"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'content') {
    return (
      <div className="inventory-content">
        <div className="content-header">
          <div className="skeleton-header"></div>
          <div className="skeleton-button"></div>
        </div>
        <div className="skeleton-table">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'full') {
    return (
      <>
        <div className="inventory-stats-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="inventory-stat-card inventory-skeleton-card">
              <div className="skeleton-title"></div>
              <div className="skeleton-value"></div>
            </div>
          ))}
        </div>
        <div className="inventory-content">
          <div className="content-header">
            <div className="skeleton-header"></div>
            <div className="skeleton-button"></div>
          </div>
          <div className="skeleton-table">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="skeleton-row"></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Default table skeleton
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row"></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
