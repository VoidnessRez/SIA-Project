import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './Accessories.css';

const BACKEND_URL = 'http://localhost:5174';
const IMAGE_FIELDS = ['image_url', 'image_2', 'image_3'];

const Accessories = () => {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [brands, setBrands] = useState({});
  const [partTypes, setPartTypes] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePaths, setUploadedImagePaths] = useState({ image_url: '', image_2: '', image_3: '' });
  const [stockFilter, setStockFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [strictSearch, setStrictSearch] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    reorder_level: 10,
    reorder_quantity: 20,
    max_stock_level: 100,
    quality_type: 'unknown',
    brand_id: '',
    part_type_id: '',
    image_url: '',
    image_2: '',
    image_3: '',
    unit: 'piece'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [accRes, brandsRes, typesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/accessories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/part-types`).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      if (accRes.success) setAccessories(accRes.data || []);
      if (brandsRes.success) setBrands(brandsRes.data || {});
      if (typesRes.success) setPartTypes(typesRes.data || []);
    } catch (err) {
      console.error('Error fetching accessories:', err);
      setError('Failed to load accessories data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setUploadedImagePaths({ image_url: '', image_2: '', image_3: '' });
    setFormData({
      sku: `ACC-${Date.now()}`,
      name: '',
      description: '',
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      reorder_level: 10,
      reorder_quantity: 20,
      max_stock_level: 100,
      quality_type: 'unknown',
      brand_id: '',
      part_type_id: '',
      image_url: '',
      image_2: '',
      image_3: '',
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setUploadedImagePaths({
      image_url: extractStoragePathFromUrl(item.image_url),
      image_2: extractStoragePathFromUrl(item.image_2),
      image_3: extractStoragePathFromUrl(item.image_3)
    });
    setFormData({
      sku: item.sku || '',
      name: item.name || '',
      description: item.description || '',
      cost_price: item.cost_price || 0,
      selling_price: item.selling_price || 0,
      stock_quantity: item.stock_quantity || 0,
      reorder_level: item.reorder_level || 10,
      reorder_quantity: item.reorder_quantity || 20,
      max_stock_level: item.max_stock_level || 100,
      quality_type: item.quality_type || 'unknown',
      brand_id: item.accessory_brand_id,
      part_type_id: item.part_type_id || '',
      image_url: item.image_url || '',
      image_2: item.image_2 || '',
      image_3: item.image_3 || '',
      unit: item.unit || 'piece'
    });
    setShowAddModal(true);
  };

  const isImageUrl = (value) => {
    if (!value) return false;
    return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
  };

  const extractStoragePathFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const marker = '/storage/v1/object/public/profiles/';
    const idx = url.indexOf(marker);
    if (idx === -1) return '';
    return url.slice(idx + marker.length);
  };

  const handleImageUpload = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!IMAGE_FIELDS.includes(fieldName)) {
      event.target.value = '';
      return;
    }

    try {
      setUploadingImage(true);
      const payload = new FormData();
      payload.append('image', file);
      payload.append('sku', formData.sku || `ACC-${Date.now()}`);
      payload.append('productType', 'accessory');

      const response = await fetch(`${BACKEND_URL}/api/upload/product-image`, {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setFormData((prev) => ({ ...prev, [fieldName]: data.url }));
      setUploadedImagePaths((prev) => ({
        ...prev,
        [fieldName]: data.path || extractStoragePathFromUrl(data.url)
      }));
    } catch (uploadErr) {
      console.error('Error uploading accessory image:', uploadErr);
      alert(`Upload failed: ${uploadErr.message}`);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (fieldName) => {
    if (!IMAGE_FIELDS.includes(fieldName)) return;

    const pathFromUrl = extractStoragePathFromUrl(formData[fieldName]);
    const targetPath = uploadedImagePaths[fieldName] || pathFromUrl;

    try {
      if (targetPath) {
        await fetch(`${BACKEND_URL}/api/upload/product-image`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath })
        });
      }
    } catch (deleteErr) {
      console.error('Error deleting accessory image:', deleteErr);
    } finally {
      setFormData((prev) => ({ ...prev, [fieldName]: '' }));
      setUploadedImagePaths((prev) => ({ ...prev, [fieldName]: '' }));
    }
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

      const payload = {
        ...formData,
        accessory_brand_id: parseInt(formData.brand_id) || null,
        part_type_id: parseInt(formData.part_type_id) || null,
        quality_type: formData.quality_type || 'unknown',
      };

      delete payload.brand_id;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    const numericFields = new Set([
      'cost_price',
      'selling_price',
      'stock_quantity',
      'reorder_level',
      'reorder_quantity',
      'max_stock_level'
    ]);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (numericFields.has(name) ? parseFloat(value) || 0 : value)
    }));
  };

  // Helper function to determine stock status
  const getStockStatus = (item) => {
    if (item.stock_quantity <= item.reorder_level) return 'low';
    if (item.stock_quantity >= (item.max_stock_level || 100)) return 'overstocked';
    return 'normal';
  };

  // Filter accessories by stock status
  const filteredAccessories = accessories.filter(item => {
    const matchesStock = stockFilter === 'all' || getStockStatus(item) === stockFilter;
    const search = String(searchQuery || '').toLowerCase().trim();
    const searchableFields = [
      String(item.sku || '').toLowerCase().trim(),
      String(item.name || '').toLowerCase().trim(),
      String(item.description || '').toLowerCase().trim(),
      String(item.brand_name || item.accessory_brand?.name || '').toLowerCase().trim(),
      String(item.part_type_name || item.part_type?.name || '').toLowerCase().trim()
    ];
    const matchesSearch =
      search === '' ||
      (strictSearch
        ? searchableFields.some((field) => field === search)
        : searchableFields.some((field) => field.includes(search)));

    return matchesStock && matchesSearch;
  });

  // Calculate stock statistics
  const stockStats = {
    total: accessories.length,
    low: accessories.filter(i => getStockStatus(i) === 'low').length,
    normal: accessories.filter(i => getStockStatus(i) === 'normal').length,
    overstocked: accessories.filter(i => getStockStatus(i) === 'overstocked').length
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
      <div className="inventory-container accessories">
        <div className="inventory-header">
          <h2>Accessories Inventory</h2>
          <button className="add-btn" onClick={handleAddItem}>+ Add Accessory</button>
        </div>

        {/* Stock Status Dashboard */}
        <div className="stock-dashboard">
          <div className="stat-card total">
            <span className="stat-icon">📦</span>
            <div className="stat-info">
              <div className="stat-value">{stockStats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
          <div className="stat-card low">
            <span className="stat-icon">🔴</span>
            <div className="stat-info">
              <div className="stat-value">{stockStats.low}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
          <div className="stat-card normal">
            <span className="stat-icon">🟢</span>
            <div className="stat-info">
              <div className="stat-value">{stockStats.normal}</div>
              <div className="stat-label">Normal Stock</div>
            </div>
          </div>
          <div className="stat-card overstocked">
            <span className="stat-icon">🟡</span>
            <div className="stat-info">
              <div className="stat-value">{stockStats.overstocked}</div>
              <div className="stat-label">Overstocked</div>
            </div>
          </div>
        </div>

        {/* Stock Filter Buttons */}
        <div className="stock-filters">
          <button 
            className={stockFilter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setStockFilter('all')}
          >
            All Items ({stockStats.total})
          </button>
          <button 
            className={stockFilter === 'low' ? 'filter-btn active low' : 'filter-btn low'}
            onClick={() => setStockFilter('low')}
          >
            🔴 Low Stock ({stockStats.low})
          </button>
          <button 
            className={stockFilter === 'normal' ? 'filter-btn active normal' : 'filter-btn normal'}
            onClick={() => setStockFilter('normal')}
          >
            🟢 Normal ({stockStats.normal})
          </button>
          <button 
            className={stockFilter === 'overstocked' ? 'filter-btn active overstocked' : 'filter-btn overstocked'}
            onClick={() => setStockFilter('overstocked')}
          >
            🟡 Overstocked ({stockStats.overstocked})
          </button>
        </div>

        <div className="inventory-search-controls">
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search SKU, name, brand, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <label className="inventory-search-toggle">
            <input
              type="checkbox"
              checked={strictSearch}
              onChange={(e) => setStrictSearch(e.target.checked)}
            />
            Exact match
          </label>
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
                <th>Overstock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessories.length > 0 ? (
                filteredAccessories.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>{item.brand_name || item.accessory_brand?.name || 'N/A'}</td>
                      <td>₱{item.cost_price?.toFixed(2)}</td>
                      <td>₱{item.selling_price?.toFixed(2)}</td>
                      <td className={`stock-cell ${status}`}>
                        <span className="stock-value">{item.stock_quantity}</span>
                      </td>
                      <td>{item.reorder_level}</td>
                      <td>{item.max_stock_level || 100}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'low' && '🔴 Low'}
                          {status === 'normal' && '🟢 Normal'}
                          {status === 'overstocked' && '🟡 Overstocked'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="edit-btn" onClick={() => handleEditItem(item)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="10" className="no-data">No accessories found for your current filter/search</td></tr>
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
                    <label>Reorder Level (Min)</label>
                    <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} />
                    <small>Alert when stock falls below this</small>
                  </div>
                  <div className="form-group">
                    <label>Reorder Qty</label>
                    <input type="number" name="reorder_quantity" value={formData.reorder_quantity} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Overstock Level (Max)</label>
                    <input type="number" name="max_stock_level" value={formData.max_stock_level} onChange={handleInputChange} />
                    <small>Alert when stock exceeds this</small>
                  </div>
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <select name="brand_id" value={formData.brand_id} onChange={handleInputChange}>
                    <option value="">Select Brand</option>
                    {(brands.accessory || []).map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Part Type</label>
                  <select name="part_type_id" value={formData.part_type_id} onChange={handleInputChange}>
                    <option value="">Select Type</option>
                    {partTypes.filter((type) => type.category === 'accessory').map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Brand Quality</label>
                  <select name="quality_type" value={formData.quality_type} onChange={handleInputChange}>
                    <option value="unknown">Unspecified</option>
                    <option value="genuine">Genuine / OEM</option>
                    <option value="aftermarket">Aftermarket</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Product Photos (max 3)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {IMAGE_FIELDS.map((fieldName, index) => (
                      <div key={fieldName}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Photo {index + 1}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, fieldName)}
                          disabled={uploadingImage}
                        />
                        {isImageUrl(formData[fieldName]) ? (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={formData[fieldName]}
                              alt={`Photo ${index + 1}`}
                              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d9d9d9' }}
                            />
                            <button type="button" className="delete-btn" onClick={() => handleRemoveImage(fieldName)}>Remove</button>
                          </div>
                        ) : (
                          <small>No photo uploaded</small>
                        )}
                      </div>
                    ))}
                  </div>
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
