import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './Accessories.css';

const BACKEND_URL = 'http://localhost:5174';

const Accessories = () => {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [brands, setBrands] = useState({});

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    reorder_level: 10,
    reorder_quantity: 20,
    brand_id: '',
    image_url: '🎁',
    unit: 'piece'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [accRes, brandsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/accessories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      if (accRes.success) setAccessories(accRes.data || []);
      if (brandsRes.success) setBrands(brandsRes.data || {});
    } catch (err) {
      console.error('Error fetching accessories:', err);
      setError('Failed to load accessories data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      sku: `ACC-${Date.now()}`,
      name: '',
      description: '',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      reorder_level: 10,
      reorder_quantity: 20,
      brand_id: '',
      image_url: '🎁',
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku || '',
      name: item.name || '',
      description: item.description || '',
      cost_price: item.cost_price || 0,
      selling_price: item.selling_price || 0,
      stock_quantity: item.stock_quantity || 0,
      reorder_level: item.reorder_level || 10,
      reorder_quantity: item.reorder_quantity || 20,
      brand_id: item.accessory_brand_id,
      image_url: item.image_url || '🎁',
      unit: item.unit || 'piece'
    });
    setShowAddModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.selling_price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${BACKEND_URL}/api/inventory/accessories/${editingItem.id}`
        : `${BACKEND_URL}/api/inventory/accessories`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchData();
        alert(`Accessory ${editingItem ? 'updated' : 'created'} successfully`);
      } else {
        alert('Failed to save accessory');
      }
    } catch (err) {
      console.error('Error saving accessory:', err);
      alert('Error saving accessory');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this accessory?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/accessories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
        alert('Accessory deleted successfully');
      } else {
        alert('Failed to delete accessory');
      }
    } catch (err) {
      console.error('Error deleting accessory:', err);
      alert('Error deleting accessory');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('price') || name.includes('quantity') || name.includes('level') ? parseFloat(value) || 0 : value)
    }));
  };

  if (loading) return (
    <AdminLayout title="Accessories" description="Manage motorcycle accessories inventory">
      <SkeletonLoader type="content" rows={8} />
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout title="Accessories" description="Manage motorcycle accessories inventory">
      <div className="error">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Accessories" description="Manage motorcycle accessories inventory">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Accessories Inventory</h2>
          <button className="add-btn" onClick={handleAddItem}>+ Add Accessory</button>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Reorder Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessories.length > 0 ? (
                accessories.map(item => (
                  <tr key={item.id}>
                    <td>{item.sku}</td>
                    <td>{item.name}</td>
                    <td>{item.brand_name || 'N/A'}</td>
                    <td>₱{item.cost_price?.toFixed(2)}</td>
                    <td>₱{item.selling_price?.toFixed(2)}</td>
                    <td className={item.stock_quantity < item.reorder_level ? 'low-stock' : ''}>{item.stock_quantity}</td>
                    <td>{item.reorder_level}</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEditItem(item)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="no-data">No accessories found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingItem ? 'Edit Accessory' : 'Add New Accessory'}</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>SKU</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cost Price</label>
                    <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Selling Price *</label>
                    <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} step="0.01" required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Reorder Level</label>
                    <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Reorder Qty</label>
                    <input type="number" name="reorder_quantity" value={formData.reorder_quantity} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <select name="brand_id" value={formData.brand_id} onChange={handleInputChange}>
                    <option value="">Select Brand</option>
                    {Object.entries(brands.accessory || {}).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange}>
                    <option value="piece">Piece</option>
                    <option value="set">Set</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSaveItem}>Save Accessory</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Accessories;
