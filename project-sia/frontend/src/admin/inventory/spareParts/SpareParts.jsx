import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layout/AdminLayout';
import './SpareParts.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const SpareParts = () => {
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [brands, setBrands] = useState({});
  const [partTypes, setPartTypes] = useState([]);

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
    part_type_id: '',
    is_universal: true,
    image_url: '⚙️',
    warranty_months: 0,
    unit: 'piece'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [partsRes, brandsRes, typesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/spare-parts`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/part-types`).then(r => r.json())
      ]);

      if (partsRes.success) setSpareParts(partsRes.data || []);
      if (brandsRes.success) setBrands(brandsRes.data || {});
      if (typesRes.success) setPartTypes(typesRes.data || []);
    } catch (err) {
      console.error('Error fetching spare parts:', err);
      setError('Failed to load spare parts data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = () => {
    setEditingPart(null);
    setFormData({
      sku: `SP-${Date.now()}`,
      name: '',
      description: '',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      reorder_level: 10,
      reorder_quantity: 20,
      brand_id: '',
      part_type_id: '',
      is_universal: true,
      image_url: '⚙️',
      warranty_months: 0,
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setFormData({
      sku: part.sku || '',
      name: part.name || '',
      description: part.description || '',
      cost_price: part.cost_price || 0,
      selling_price: part.selling_price || 0,
      stock_quantity: part.stock_quantity || 0,
      reorder_level: part.reorder_level || 10,
      reorder_quantity: part.reorder_quantity || 20,
      brand_id: part.sparepart_brand_id,
      part_type_id: part.part_type_id || '',
      is_universal: part.is_universal || true,
      image_url: part.image_url || '⚙️',
      warranty_months: part.warranty_months || 0,
      unit: part.unit || 'piece'
    });
    setShowAddModal(true);
  };

  const handleSavePart = async () => {
    if (!formData.name || !formData.selling_price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const method = editingPart ? 'PUT' : 'POST';
      const url = editingPart 
        ? `${BACKEND_URL}/api/inventory/spare-parts/${editingPart.id}`
        : `${BACKEND_URL}/api/inventory/spare-parts`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchData();
        alert(`Spare part ${editingPart ? 'updated' : 'created'} successfully`);
      } else {
        alert('Failed to save spare part');
      }
    } catch (err) {
      console.error('Error saving spare part:', err);
      alert('Error saving spare part');
    }
  };

  const handleDeletePart = async (id) => {
    if (!confirm('Are you sure you want to delete this spare part?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/inventory/spare-parts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
        alert('Spare part deleted successfully');
      } else {
        alert('Failed to delete spare part');
      }
    } catch (err) {
      console.error('Error deleting spare part:', err);
      alert('Error deleting spare part');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('price') || name.includes('quantity') || name.includes('level') || name.includes('months') ? parseFloat(value) || 0 : value)
    }));
  };

  if (loading) return <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory"><div className="loading">Loading spare parts...</div></AdminLayout>;
  if (error) return <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory"><div className="error">{error}</div></AdminLayout>;

  return (
    <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Spare Parts Inventory</h2>
          <button className="add-btn" onClick={handleAddPart}>+ Add Spare Part</button>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Reorder Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {spareParts.length > 0 ? (
                spareParts.map(part => (
                  <tr key={part.id}>
                    <td>{part.sku}</td>
                    <td>{part.name}</td>
                    <td>{part.brand_name || 'N/A'}</td>
                    <td>{part.part_type_name || 'N/A'}</td>
                    <td>₱{part.cost_price?.toFixed(2)}</td>
                    <td>₱{part.selling_price?.toFixed(2)}</td>
                    <td className={part.stock_quantity < part.reorder_level ? 'low-stock' : ''}>{part.stock_quantity}</td>
                    <td>{part.reorder_level}</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => handleEditPart(part)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDeletePart(part.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="9" className="no-data">No spare parts found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}</h3>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Brand</label>
                    <select name="brand_id" value={formData.brand_id} onChange={handleInputChange}>
                      <option value="">Select Brand</option>
                      {Object.entries(brands.sparepart || {}).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Part Type</label>
                    <select name="part_type_id" value={formData.part_type_id} onChange={handleInputChange}>
                      <option value="">Select Type</option>
                      {partTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Warranty (months)</label>
                    <input type="number" name="warranty_months" value={formData.warranty_months} onChange={handleInputChange} />
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

                <div className="form-group">
                  <label>
                    <input type="checkbox" name="is_universal" checked={formData.is_universal} onChange={handleInputChange} />
                    Universal (Fits all motorcycle models)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleSavePart}>Save Spare Part</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SpareParts;
