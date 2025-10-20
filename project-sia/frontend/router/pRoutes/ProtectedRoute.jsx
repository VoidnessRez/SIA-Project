import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #f8f9fa)'
      }}>
        <div style={{
          fontSize: '1.5rem',
          color: 'var(--text-primary, #333)'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated()) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
