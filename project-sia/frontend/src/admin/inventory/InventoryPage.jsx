import React from 'react';
import { useNavigate } from 'react-router-dom';

const InventoryPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Inventory System (Admin Only)</h1>
      <p>This is a placeholder page for your inventory system.</p>
      <button onClick={() => navigate(-1)} style={{ marginTop: 24, padding: '0.5rem 1.5rem', fontSize: '1rem', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Go Back
      </button>
    </div>
  );
};

export default InventoryPage;
