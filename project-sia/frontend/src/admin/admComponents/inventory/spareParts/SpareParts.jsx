import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './SpareParts.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';
const IMAGE_FIELDS = ['image_url', 'image_2', 'image_3'];

const SpareParts = () => {
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [brands, setBrands] = useState({});
  const [partTypes, setPartTypes] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePaths, setUploadedImagePaths] = useState({ image_url: '', image_2: '', image_3: '' });
  const [showImageManager, setShowImageManager] = useState(false);
  const [stockFilter, setStockFilter] = useState('all'); // all, low, normal, overstocked
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
    is_universal: true,
    image_url: '',
    image_2: '',
    image_3: '',
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
      // Minimum 2 second delay for skeleton visibility
      const [partsRes, brandsRes, typesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/spare-parts`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/part-types`).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 2000))
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
    setShowImageManager(false);
    setUploadedImagePaths({ image_url: '', image_2: '', image_3: '' });
    setFormData({
      sku: `SP-${Date.now()}`,
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
      is_universal: true,
      image_url: '',
      image_2: '',
      image_3: '',
      warranty_months: 0,
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setShowImageManager(false);
    setUploadedImagePaths({
      image_url: extractStoragePathFromUrl(part.image_url),
      image_2: extractStoragePathFromUrl(part.image_2),
      image_3: extractStoragePathFromUrl(part.image_3)
    });
    setFormData({
      sku: part.sku || '',
      name: part.name || '',
      description: part.description || '',
      cost_price: part.cost_price || 0,
      selling_price: part.selling_price || 0,
      stock_quantity: part.stock_quantity || 0,
      reorder_level: part.reorder_level || 10,
      reorder_quantity: part.reorder_quantity || 20,
      max_stock_level: part.max_stock_level || 100,
      quality_type: part.quality_type || 'unknown',
      brand_id: part.sparepart_brand_id,
      part_type_id: part.part_type_id || '',
      is_universal: part.is_universal !== undefined ? part.is_universal : true,
      image_url: part.image_url || '',
      image_2: part.image_2 || '',
      image_3: part.image_3 || '',
      warranty_months: part.warranty_months || 0,
      unit: part.unit || 'piece'
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
      payload.append('sku', formData.sku || `SP-${Date.now()}`);
      payload.append('productType', 'sparepart');

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
      console.error('Error uploading spare part image:', uploadErr);
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
      console.error('Error deleting spare part image:', deleteErr);
    } finally {
      setFormData((prev) => ({ ...prev, [fieldName]: '' }));
      setUploadedImagePaths((prev) => ({ ...prev, [fieldName]: '' }));
    }
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

      const payload = {
        ...formData,
        sparepart_brand_id: parseInt(formData.brand_id) || null,
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
    const numericFields = new Set([
      'cost_price',
      'selling_price',
      'stock_quantity',
      'reorder_level',
      'reorder_quantity',
      'max_stock_level',
      'warranty_months'
    ]);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (numericFields.has(name) ? parseFloat(value) || 0 : value)
    }));
  };

  const autoResizeTextarea = (el) => {
    if (!el) return;
    el.style.height = '48px';
    el.style.height = `${Math.max(48, el.scrollHeight)}px`;
  };

  // Helper function to determine stock status
  const getStockStatus = (part) => {
    if (part.stock_quantity <= part.reorder_level) return 'low';
    if (part.stock_quantity >= (part.max_stock_level || 100)) return 'overstocked';
    return 'normal';
  };

  // Filter spare parts by stock status
  const filteredSpareParts = spareParts.filter(part => {
    const matchesStock = stockFilter === 'all' || getStockStatus(part) === stockFilter;
    const search = String(searchQuery || '').toLowerCase().trim();
    const searchableFields = [
      String(part.sku || '').toLowerCase().trim(),
      String(part.name || '').toLowerCase().trim(),
      String(part.description || '').toLowerCase().trim(),
      String(part.brand_name || part.sparepart_brand?.name || '').toLowerCase().trim(),
      String(part.part_type_name || part.part_type?.name || '').toLowerCase().trim()
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
    total: spareParts.length,
    low: spareParts.filter(p => getStockStatus(p) === 'low').length,
    normal: spareParts.filter(p => getStockStatus(p) === 'normal').length,
    overstocked: spareParts.filter(p => getStockStatus(p) === 'overstocked').length
  };

  if (loading) return (
    <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory">
      <SkeletonLoader type="content" rows={8} />
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory">
      <div className="error">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Spare Parts" description="Manage motorcycle spare parts inventory">
      <div className="inventory-container spare-parts">
        <div className="inventory-header">
          <h2>Spare Parts Inventory</h2>
          <button className="add-btn" onClick={handleAddPart}>+ Add Spare Part</button>
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
                <th>Type</th>
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
              {filteredSpareParts.length > 0 ? (
                filteredSpareParts.map(part => {
                  const status = getStockStatus(part);
                  return (
                    <tr key={part.id}>
                      <td>{part.sku}</td>
                      <td>{part.name}</td>
                      <td>{part.brand_name || part.sparepart_brand?.name || 'N/A'}</td>
                      <td>{part.part_type_name || part.part_type?.name || 'N/A'}</td>
                      <td>₱{part.cost_price?.toFixed(2)}</td>
                      <td>₱{part.selling_price?.toFixed(2)}</td>
                      <td className={`stock-cell ${status}`}>
                        <span className="stock-value">{part.stock_quantity}</span>
                      </td>
                      <td>{part.reorder_level}</td>
                      <td>{part.max_stock_level || 100}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'low' && '🔴 Low'}
                          {status === 'normal' && '🟢 Normal'}
                          {status === 'overstocked' && '🟡 Overstocked'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="edit-btn" onClick={() => handleEditPart(part)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDeletePart(part.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="11" className="no-data">No spare parts found for your current filter/search</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal inventory-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowImageManager(false);
                  }}
                >
                  ×
                </button>
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
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    rows="1"
                  ></textarea>
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
                    <label>Overstock Level (Max)</label>
                    <input type="number" name="max_stock_level" value={formData.max_stock_level} onChange={handleInputChange} />
                    <small>Alert when stock exceeds this</small>
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
                      {(brands.sparepart || []).map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Part Type</label>
                    <select name="part_type_id" value={formData.part_type_id} onChange={handleInputChange}>
                      <option value="">Select Type</option>
                      {partTypes.filter((type) => type.category === 'sparepart').map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
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
                    <div className="inventory-photo-manager-row">
                      <span className="inventory-photo-count">
                        {IMAGE_FIELDS.filter((field) => isImageUrl(formData[field])).length} of {IMAGE_FIELDS.length} uploaded
                      </span>
                      <button
                        type="button"
                        className="inventory-see-more-btn"
                        onClick={() => setShowImageManager(true)}
                      >
                        Manage Photos
                      </button>
                    </div>
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
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowImageManager(false);
                  }}
                >
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSavePart}>Save Spare Part</button>
              </div>
            </div>

            {showImageManager && (
              <div className="inventory-nested-overlay" onClick={() => setShowImageManager(false)}>
                <div className="inventory-nested-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="inventory-nested-header">
                    <h4>Product Photos</h4>
                    <button type="button" className="modal-close" onClick={() => setShowImageManager(false)}>×</button>
                  </div>

                  <div className="inventory-nested-body">
                    {IMAGE_FIELDS.map((fieldName, index) => (
                      <div key={fieldName} className="inventory-photo-slot">
                        <label>Photo {index + 1}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, fieldName)}
                          disabled={uploadingImage}
                        />

                        {isImageUrl(formData[fieldName]) ? (
                          <div className="inventory-photo-preview">
                            <img src={formData[fieldName]} alt={`Photo ${index + 1}`} />
                            <button type="button" className="delete-btn" onClick={() => handleRemoveImage(fieldName)}>Remove</button>
                          </div>
                        ) : (
                          <small>No photo uploaded</small>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="inventory-nested-footer">
                    <button type="button" className="save-btn" onClick={() => setShowImageManager(false)}>Done</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SpareParts;
