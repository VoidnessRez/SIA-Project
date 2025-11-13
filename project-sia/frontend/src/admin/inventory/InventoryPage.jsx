import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import './Shared.css';

const BACKEND_URL = 'http://localhost:5174';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState('spare-parts');
  const [spareParts, setSpareParts] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [brands, setBrands] = useState({});
  const [partTypes, setPartTypes] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form state
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

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [spData, accData, brandsData, typesData, lowStockData] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/spare-parts`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/accessories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/part-types`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/low-stock`).then(r => r.json())
      ]);

      if (spData.success) setSpareParts(spData.data || []);
      if (accData.success) setAccessories(accData.data || []);
      if (brandsData.success) setBrands(brandsData.data || {});
      if (typesData.success) setPartTypes(typesData.data || []);
      if (lowStockData.success) setLowStockItems(lowStockData.data || []);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Date.now()}`,
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
      image_url: activeTab === 'spare-parts' ? '⚙️' : '🛡️',
      warranty_months: 0,
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      stock_quantity: product.stock_quantity || 0,
      reorder_level: product.reorder_level || 10,
      reorder_quantity: product.reorder_quantity || 20,
      brand_id: activeTab === 'spare-parts' ? product.sparepart_brand_id : product.accessory_brand_id,
      part_type_id: product.part_type_id || '',
      is_universal: product.is_universal !== undefined ? product.is_universal : true,
      image_url: product.image_url || '⚙️',
      warranty_months: product.warranty_months || 0,
      unit: product.unit || 'piece'
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = activeTab === 'spare-parts' ? 'spare-parts' : 'accessories';
      const brandKey = activeTab === 'spare-parts' ? 'sparepart_brand_id' : 'accessory_brand_id';
      
      const payload = {
        ...formData,
        [brandKey]: parseInt(formData.brand_id),
        part_type_id: parseInt(formData.part_type_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        reorder_quantity: parseInt(formData.reorder_quantity),
        warranty_months: parseInt(formData.warranty_months)
      };

      // Remove brand_id from payload as we renamed it
      delete payload.brand_id;

      const url = editingProduct
        ? `${BACKEND_URL}/api/inventory/${endpoint}/${editingProduct.id}`
        : `${BACKEND_URL}/api/inventory/${endpoint}`;
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        fetchAllData();
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setLoading(true);
    try {
      const endpoint = activeTab === 'spare-parts' ? 'spare-parts' : 'accessories';
      const response = await fetch(`${BACKEND_URL}/api/inventory/${endpoint}/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        fetchAllData();
        alert('Product deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const getStockBadge = (quantity, reorderLevel) => {
    if (quantity === 0) return <span className="stock-badge out-of-stock">Out of Stock</span>;
    if (quantity <= reorderLevel) return <span className="stock-badge low-stock">Low Stock</span>;
    return <span className="stock-badge in-stock">In Stock</span>;
  };

  const getCurrentProducts = () => {
    if (activeTab === 'spare-parts') return spareParts;
    if (activeTab === 'accessories') return accessories;
    if (activeTab === 'low-stock') return lowStockItems;
    return [];
  };

  const getCurrentBrands = () => {
    if (activeTab === 'spare-parts') return brands.sparepart || [];
    if (activeTab === 'accessories') return brands.accessory || [];
    return [];
  };

  const stats = {
    totalSpareParts: spareParts.length,
    totalAccessories: accessories.length,
    totalProducts: spareParts.length + accessories.length,
    lowStockCount: lowStockItems.length,
    totalValue: [...spareParts, ...accessories].reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0)
  };

  return (
    <AdminLayout 
      title="Inventory Management" 
      description="Manage your spare parts and accessories inventory"
    >
      <div className="inventory-page-content">
        {/* Stats Cards */}
        <div className="inventory-stats-grid">
          <div className="inventory-stat-card">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
          <div className="inventory-stat-card">
            <h3>Spare Parts</h3>
            <p>{stats.totalSpareParts}</p>
          </div>
          <div className="inventory-stat-card">
            <h3>Accessories</h3>
            <p>{stats.totalAccessories}</p>
          </div>
          <div className="inventory-stat-card">
            <h3>Low Stock Items</h3>
            <p>{stats.lowStockCount}</p>
          </div>
          <div className="inventory-stat-card">
            <h3>Total Inventory Value</h3>
            <p>₱{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        {/* <div className="inventory-tabs">
          <button
            className={`tab-button ${activeTab === 'spare-parts' ? 'active' : ''}`}
            onClick={() => setActiveTab('spare-parts')}
          >
            ⚙️ Spare Parts ({spareParts.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            🛡️ Accessories ({accessories.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'low-stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('low-stock')}
          >
            ⚠️ Low Stock ({lowStockItems.length})
          </button>
        </div> */}

        {/* Content */}
        <div className="inventory-content">
          {error && <div className="error-message">{error}</div>}

          <div className="content-header">
            <h2>
              {activeTab === 'spare-parts' && '⚙️ Spare Parts'}
              {activeTab === 'accessories' && '🛡️ Accessories'}
              {activeTab === 'low-stock' && '⚠️ Low Stock Items'}
            </h2>
            {activeTab !== 'low-stock' && (
              <button className="add-button" onClick={handleAddProduct}>
                ➕ Add {activeTab === 'spare-parts' ? 'Spare Part' : 'Accessory'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner">⏳ Loading...</div>
          ) : getCurrentProducts().length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No Products Found</h3>
              <p>Start by adding your first product</p>
              {activeTab !== 'low-stock' && (
                <button className="add-button" onClick={handleAddProduct}>
                  ➕ Add Product
                </button>
              )}
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  {activeTab !== 'low-stock' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {getCurrentProducts().map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-image">{product.image_url || '⚙️'}</div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{product.brand_name || 'N/A'}</td>
                    <td>{product.part_type_name || 'N/A'}</td>
                    <td>{product.stock_quantity}</td>
                    <td>₱{parseFloat(product.cost_price || 0).toFixed(2)}</td>
                    <td>₱{parseFloat(product.selling_price || 0).toFixed(2)}</td>
                    <td>{getStockBadge(product.stock_quantity, product.reorder_level)}</td>
                    {activeTab !== 'low-stock' && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-button edit"
                            onClick={() => handleEditProduct(product)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-button delete"
                            onClick={() => handleDelete(product.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit' : 'Add'} {activeTab === 'spare-parts' ? 'Spare Part' : 'Accessory'}</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="piece">Piece</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    required
                  >
                    <option value="">Select Brand</option>
                    {getCurrentBrands().map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Part Type *</label>
                  <select
                    value={formData.part_type_id}
                    onChange={(e) => setFormData({ ...formData, part_type_id: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    {partTypes
                      .filter(type => type.category === (activeTab === 'spare-parts' ? 'sparepart' : 'accessory'))
                      .map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reorder Quantity</label>
                  <input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Warranty (months)</label>
                  <input
                    type="number"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image (emoji or URL)</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_universal}
                    onChange={(e) => setFormData({ ...formData, is_universal: e.target.checked })}
                  />
                  {' '}Universal Fit (works with all brands)
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="form-button cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="form-button submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Add')} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default InventoryPage;
