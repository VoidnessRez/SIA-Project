import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../AdminAuth/layout/AdminLayout';
import './Shared.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

const InventoryPage = () => {
  const IMAGE_FIELDS = ['image_url', 'image_2', 'image_3'];
  const [activeTab, setActiveTab] = useState('spare-parts');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'browser'
  const [selectedBikeBrand, setSelectedBikeBrand] = useState('all'); // For motorcycle browser
  const [expandedBrands, setExpandedBrands] = useState({}); // Track expanded accordion sections
  const [spareParts, setSpareParts] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [brands, setBrands] = useState({});
  const [partTypes, setPartTypes] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [overstockItems, setOverstockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showFitmentOptions, setShowFitmentOptions] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImagePaths, setUploadedImagePaths] = useState({
    image_url: '',
    image_2: '',
    image_3: ''
  });

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
    max_stock_level: 100,
    quality_type: 'unknown',
    brand_id: '',
    part_type_id: '',
    is_universal: true,
    compatible_bike_models: '',
    dimensions: '',
    available_sizes: '',
    available_colors: '',
    image_url: '',
    image_2: '',
    image_3: '',
    warranty_months: 0,
    unit: 'piece'
  });

  const formatCompatibilityForTextarea = (rawValue) => {
    if (!rawValue) return '';

    if (Array.isArray(rawValue)) {
      return rawValue.map((item) => String(item || '').trim()).filter(Boolean).join('\n');
    }

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed || trimmed === '[]' || trimmed.toLowerCase() === 'null') return '';

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item || '').trim()).filter(Boolean).join('\n');
        }
      } catch {
        return trimmed;
      }
    }

    return '';
  };

  const normalizeCompatibilityForSave = (rawValue, isUniversal) => {
    if (isUniversal) return '[]';

    const list = String(rawValue || '')
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    return JSON.stringify(Array.from(new Set(list)));
  };

  const toFriendlyPartTypeLabel = (name) => {
    const value = String(name || '').trim().toLowerCase();
    if (!value) return 'Other';
    if (value.includes('wheel') || value.includes('tire')) return 'Gulong at Tires';
    if (value.includes('brake')) return 'Preno';
    if (value.includes('engine')) return 'Makina';
    if (value.includes('electrical')) return 'Electrical';
    if (value.includes('drivetrain') || value.includes('transmission')) return 'Drivetrain';
    if (value.includes('fuel')) return 'Fuel System';
    if (value.includes('lighting')) return 'Ilaw';
    if (value.includes('safety')) return 'Safety Gear';
    if (value.includes('body')) return 'Body Parts';
    if (value.includes('control')) return 'Controls';
    if (value.includes('intake') || value.includes('air')) return 'Air Intake';
    if (value.includes('ignition')) return 'Ignition';
    return String(name || 'Other');
  };

  // Get all unique motorcycle brands from compatible_bike_models
  const getAllMotorcycleBrands = () => {
    const allProducts = [...spareParts, ...accessories];
    const bikeBrandsSet = new Set();
    
    allProducts.forEach(product => {
      if (product.compatible_bike_models && typeof product.compatible_bike_models === 'string') {
        try {
          const models = JSON.parse(product.compatible_bike_models);
          if (Array.isArray(models)) {
            models.forEach(model => {
              const brand = String(model || '').split(' ')[0]?.trim();
              if (brand && brand.toLowerCase() !== 'universal') {
                bikeBrandsSet.add(brand);
              }
            });
          }
        } catch {
          // Silent catch
        }
      }
    });
    
    return Array.from(bikeBrandsSet).sort();
  };

  // Group products by their brand (manufacturer)
  const groupProductsByBrand = (products) => {
    const grouped = {};
    products.forEach(product => {
      const brandName = product.brand_name || product.sparepart_brand?.name || product.accessory_brand?.name || 'Unknown';
      if (!grouped[brandName]) {
        grouped[brandName] = [];
      }
      grouped[brandName].push(product);
    });
    return grouped;
  };

  // Filter products by motorcycle brand
  const filterByMotorcycleBrand = (products) => {
    if (selectedBikeBrand === 'all') return products;
    
    return products.filter(product => {
      if (product.is_universal) return true; // Always include universal
      if (!product.compatible_bike_models) return false;
      
      try {
        const models = JSON.parse(product.compatible_bike_models);
        if (Array.isArray(models)) {
          return models.some(model => String(model || '').startsWith(selectedBikeBrand));
        }
      } catch {
        return false;
      }
      return false;
    });
  };

  // Toggle accordion section
  const toggleAccordion = (brandName) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brandName]: !prev[brandName]
    }));
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    try {
      // Simulate progress for visual feedback
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const [spData, accData, brandsData, typesData, lowStockData] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/spare-parts`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/accessories`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/brands`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/part-types`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/inventory/low-stock`).then(r => r.json())
      ]);

      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (spData.success) setSpareParts(spData.data || []);
      if (accData.success) setAccessories(accData.data || []);
      if (brandsData.success) setBrands(brandsData.data || {});
      if (typesData.success) setPartTypes(typesData.data || []);
      if (lowStockData.success) setLowStockItems(lowStockData.data || []);

      const mergedProducts = [...(spData.data || []), ...(accData.data || [])];
      const computedOverstock = mergedProducts.filter((item) => {
        const max = parseInt(item.max_stock_level || 100, 10);
        const qty = parseInt(item.stock_quantity || 0, 10);
        return qty >= max;
      });
      setOverstockItems(computedOverstock);

      // Delay to show 100% completion
      setTimeout(() => {
        setLoading(false);
        setInitialLoad(false);
      }, 300);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data. Please check if backend is running.');
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowImageManager(false);
    setShowFitmentOptions(false);
    setUploadedImagePaths({ image_url: '', image_2: '', image_3: '' });
    setFormData({
      sku: `SKU-${Date.now()}`,
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
      compatible_bike_models: '',
      dimensions: '',
      available_sizes: '',
      available_colors: '',
      image_url: '',
      image_2: '',
      image_3: '',
      warranty_months: 0,
      unit: 'piece'
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowImageManager(false);
    setShowFitmentOptions(
      !!(
        !product.is_universal ||
        String(product.compatible_bike_models || '').trim() ||
        String(product.available_sizes || '').trim() ||
        String(product.available_colors || '').trim()
      )
    );
    setUploadedImagePaths({
      image_url: extractStoragePathFromUrl(product.image_url),
      image_2: extractStoragePathFromUrl(product.image_2),
      image_3: extractStoragePathFromUrl(product.image_3)
    });
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      cost_price: product.cost_price || 0,
      selling_price: product.selling_price || 0,
      stock_quantity: product.stock_quantity || 0,
      reorder_level: product.reorder_level || 10,
      reorder_quantity: product.reorder_quantity || 20,
      max_stock_level: product.max_stock_level || 100,
      quality_type: product.quality_type || 'unknown',
      brand_id: activeTab === 'spare-parts' ? product.sparepart_brand_id : product.accessory_brand_id,
      part_type_id: product.part_type_id || '',
      is_universal: product.is_universal !== undefined ? product.is_universal : true,
      compatible_bike_models: formatCompatibilityForTextarea(product.compatible_bike_models),
      dimensions: product.dimensions || '',
      available_sizes: formatCompatibilityForTextarea(product.available_sizes),
      available_colors: formatCompatibilityForTextarea(product.available_colors),
      image_url: product.image_url || '',
      image_2: product.image_2 || '',
      image_3: product.image_3 || '',
      warranty_months: product.warranty_months || 0,
      unit: product.unit || 'piece'
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
      payload.append('sku', formData.sku || `SKU-${Date.now()}`);
      payload.append('productType', activeTab === 'accessories' ? 'accessory' : 'sparepart');

      const response = await fetch(`${BACKEND_URL}/api/upload/product-image`, {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      if (editingProduct?.id) {
        const endpoint = activeTab === 'spare-parts' ? 'spare-parts' : 'accessories';
        const saveResponse = await fetch(`${BACKEND_URL}/api/inventory/${endpoint}/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [fieldName]: data.url })
        });

        const saveResult = await saveResponse.json();
        if (!saveResponse.ok || !saveResult.success) {
          throw new Error(saveResult.error || 'Failed to save image to product');
        }
      }

      setFormData((prev) => ({ ...prev, [fieldName]: data.url }));
      setUploadedImagePaths((prev) => ({
        ...prev,
        [fieldName]: data.path || extractStoragePathFromUrl(data.url)
      }));
      if (editingProduct?.id) {
        await fetchAllData();
      }
      alert(`Photo ${fieldName.replace('image_', '#').replace('url', '#1')} uploaded successfully!`);
    } catch (uploadErr) {
      console.error('Error uploading product image:', uploadErr);
      alert(`Upload failed: ${uploadErr.message}`);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (fieldName) => {
    if (!IMAGE_FIELDS.includes(fieldName)) return;

    try {
      const targetPath = uploadedImagePaths[fieldName];
      if (targetPath) {
        await fetch(`${BACKEND_URL}/api/upload/product-image`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath }),
        });
      }

      setFormData((prev) => ({ ...prev, [fieldName]: '' }));
      setUploadedImagePaths((prev) => ({ ...prev, [fieldName]: '' }));

      if (editingProduct?.id) {
        const endpoint = activeTab === 'spare-parts' ? 'spare-parts' : 'accessories';
        const saveResponse = await fetch(`${BACKEND_URL}/api/inventory/${endpoint}/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [fieldName]: '' })
        });

        const saveResult = await saveResponse.json();
        if (!saveResponse.ok || !saveResult.success) {
          throw new Error(saveResult.error || 'Failed to clear image in product');
        }

        await fetchAllData();
      }
    } catch (deleteErr) {
      console.error('Error deleting product image:', deleteErr);
      setFormData((prev) => ({ ...prev, [fieldName]: '' }));
      setUploadedImagePaths((prev) => ({ ...prev, [fieldName]: '' }));
    }
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
        quality_type: formData.quality_type || 'unknown',
        part_type_id: parseInt(formData.part_type_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        reorder_quantity: parseInt(formData.reorder_quantity),
        max_stock_level: parseInt(formData.max_stock_level),
        warranty_months: parseInt(formData.warranty_months),
        compatible_bike_models: normalizeCompatibilityForSave(formData.compatible_bike_models, formData.is_universal)
      };

      if (activeTab === 'accessories') {
        payload.available_sizes = normalizeCompatibilityForSave(formData.available_sizes, false);
        payload.available_colors = normalizeCompatibilityForSave(formData.available_colors, false);
      } else {
        delete payload.available_sizes;
        delete payload.available_colors;
      }

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

  const getStockBadge = (quantity, reorderLevel, maxStockLevel = 100) => {
    if (quantity === 0) return <span className="stock-badge out-of-stock">Out of Stock</span>;
    if (quantity >= maxStockLevel) return <span className="stock-badge low-stock">Overstock</span>;
    if (quantity <= reorderLevel) return <span className="stock-badge low-stock">Low Stock</span>;
    return <span className="stock-badge in-stock">In Stock</span>;
  };

  const getCurrentProducts = () => {
    if (activeTab === 'spare-parts') return spareParts;
    if (activeTab === 'accessories') return accessories;
    if (activeTab === 'low-stock') return lowStockItems;
    if (activeTab === 'overstock') return overstockItems;
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
    overstockCount: overstockItems.length,
    totalValue: [...spareParts, ...accessories].reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0)
  };

  return (
    <AdminLayout 
      title="Inventory Management" 
      description="Manage your spare parts and accessories inventory"
    >
      {/* Loading Progress Bar */}
      {initialLoad && loadingProgress < 100 && (
        <div className="loading-bar-container">
          <div 
            className="loading-bar" 
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
      )}

      <div className="inventory-page-content">
        {loading && initialLoad ? (
          /* Skeleton Loading */
          <>
            {/* Skeleton Stats Cards */}
            <div className="inventory-stats-grid">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="inventory-stat-card inventory-skeleton-card">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-value"></div>
                </div>
              ))}
            </div>

            {/* Skeleton Content */}
            <div className="inventory-content">
              <div className="content-header">
                <div className="skeleton-header"></div>
                <div className="skeleton-button"></div>
              </div>
              <div className="skeleton-table">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton-row"></div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
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
                <h3>Overstock Items</h3>
                <p>{stats.overstockCount}</p>
              </div>
              <div className="inventory-stat-card">
                <h3>Total Inventory Value</h3>
                <p>₱{stats.totalValue.toLocaleString()}</p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f5f7fa',
              borderRadius: '8px'
            }}>
              <label style={{ fontWeight: '600', marginRight: '0.5rem' }}>View Mode:</label>
              <button
                onClick={() => {
                  setViewMode('table');
                  setActiveTab('spare-parts');
                }}
                className={`tab-button ${viewMode === 'table' ? 'active' : ''}`}
                style={{ padding: '0.5rem 1rem' }}
              >
                📊 Table View
              </button>
              <button
                onClick={() => setViewMode('browser')}
                className={`tab-button ${viewMode === 'browser' ? 'active' : ''}`}
                style={{ padding: '0.5rem 1rem' }}
              >
                🏍️ Browse by Motorcycle
              </button>
            </div>

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <>
            {/* Tabs */}
            <div className="inventory-tabs">
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
              <button
                className={`tab-button ${activeTab === 'overstock' ? 'active' : ''}`}
                onClick={() => setActiveTab('overstock')}
              >
                📈 Overstock ({overstockItems.length})
              </button>
            </div>

            {/* Content */}
            <div className="inventory-content">
              {error && <div className="error-message">{error}</div>}

          <div className="content-header">
            <h2>
              {activeTab === 'spare-parts' && '⚙️ Spare Parts'}
              {activeTab === 'accessories' && '🛡️ Accessories'}
              {activeTab === 'low-stock' && '⚠️ Low Stock Items'}
              {activeTab === 'overstock' && '📈 Overstock Items'}
            </h2>
            {activeTab !== 'low-stock' && activeTab !== 'overstock' && (
              <button className="add-button" onClick={handleAddProduct}>
                ➕ Add {activeTab === 'spare-parts' ? 'Spare Part' : 'Accessory'}
              </button>
            )}
          </div>

          {getCurrentProducts().length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No Products Found</h3>
              <p>Start by adding your first product</p>
              {activeTab !== 'low-stock' && activeTab !== 'overstock' && (
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
                      <div className="inventory-product-image">
                        {isImageUrl(product.image_url) ? (
                          <img src={product.image_url} alt={product.name} className="inventory-product-photo" />
                        ) : (
                          <span>{activeTab === 'accessories' ? '🛡️' : '⚙️'}</span>
                        )}
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                    <td>{product.brand_name || product.sparepart_brand?.name || product.accessory_brand?.name || 'N/A'}</td>
                    <td>{product.part_type_name || product.part_type?.name || 'N/A'}</td>
                    <td>{product.stock_quantity}</td>
                    <td>₱{parseFloat(product.cost_price || 0).toFixed(2)}</td>
                    <td>₱{parseFloat(product.selling_price || 0).toFixed(2)}</td>
                    <td>{getStockBadge(product.stock_quantity, product.reorder_level, product.max_stock_level || 100)}</td>
                    {activeTab !== 'low-stock' && activeTab !== 'overstock' && (
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
              </>
            )}

            {/* BROWSER VIEW */}
            {viewMode === 'browser' && (
              <div className="inventory-content">
                {error && <div className="error-message">{error}</div>}

                <div className="content-header">
                  <h2>🏍️ Browse by Motorcycle</h2>
                </div>

                {/* Motorcycle Brand Selector */}
                <div style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                    Filter by Motorcycle Brand:
                  </label>
                  <select
                    value={selectedBikeBrand}
                    onChange={(e) => setSelectedBikeBrand(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      fontSize: '1rem',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      maxWidth: '300px'
                    }}
                  >
                    <option value="all">All Motorcycles</option>
                    {getAllMotorcycleBrands().map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Spare Parts Section */}
                {spareParts.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3>⚙️ Spare Parts</h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {Object.entries(groupProductsByBrand(filterByMotorcycleBrand(spareParts))).map(([brandName, products]) => (
                        <div key={brandName} style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => toggleAccordion(`sp-${brandName}`)}
                            style={{
                              width: '100%',
                              padding: '1rem',
                              backgroundColor: '#f5f7fa',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{brandName} ({products.length})</span>
                            <span>{expandedBrands[`sp-${brandName}`] ? '▼' : '▶'}</span>
                          </button>

                          {expandedBrands[`sp-${brandName}`] && (
                            <div style={{
                              maxHeight: '400px',
                              overflowY: 'auto',
                              padding: '0.5rem'
                            }}>
                              <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                              }}>
                                <tbody>
                                  {products.map(product => (
                                    <tr key={product.id} style={{
                                      borderBottom: '1px solid #e0e0e0',
                                      hover: { backgroundColor: '#f9f9f9' }
                                    }}>
                                      <td style={{ padding: '0.75rem' }}>
                                        {isImageUrl(product.image_url) ? (
                                          <img src={product.image_url} alt={product.name} style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                          }} />
                                        ) : (
                                          <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: '500' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{product.sku}</div>
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <strong>{product.stock_quantity}</strong>
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {getStockBadge(product.stock_quantity, product.reorder_level, product.max_stock_level || 100)}
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                          onClick={() => handleEditProduct(product)}
                                          style={{
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            backgroundColor: '#4a5fc1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px'
                                          }}
                                        >
                                          Edit
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accessories Section */}
                {accessories.length > 0 && (
                  <div>
                    <h3>🛡️ Accessories</h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {Object.entries(groupProductsByBrand(filterByMotorcycleBrand(accessories))).map(([brandName, products]) => (
                        <div key={brandName} style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => toggleAccordion(`acc-${brandName}`)}
                            style={{
                              width: '100%',
                              padding: '1rem',
                              backgroundColor: '#f5f7fa',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '1rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{brandName} ({products.length})</span>
                            <span>{expandedBrands[`acc-${brandName}`] ? '▼' : '▶'}</span>
                          </button>

                          {expandedBrands[`acc-${brandName}`] && (
                            <div style={{
                              maxHeight: '400px',
                              overflowY: 'auto',
                              padding: '0.5rem'
                            }}>
                              <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                              }}>
                                <tbody>
                                  {products.map(product => (
                                    <tr key={product.id} style={{
                                      borderBottom: '1px solid #e0e0e0'
                                    }}>
                                      <td style={{ padding: '0.75rem' }}>
                                        {isImageUrl(product.image_url) ? (
                                          <img src={product.image_url} alt={product.name} style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                          }} />
                                        ) : (
                                          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: '500' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{product.sku}</div>
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <strong>{product.stock_quantity}</strong>
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {getStockBadge(product.stock_quantity, product.reorder_level, product.max_stock_level || 100)}
                                      </td>
                                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                          onClick={() => handleEditProduct(product)}
                                          style={{
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            backgroundColor: '#4a5fc1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px'
                                          }}
                                        >
                                          Edit
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowImageManager(false); }}>
          <div className="modal-content inventory-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit' : 'Add'} {activeTab === 'spare-parts' ? 'Spare Part' : 'Accessory'}</h2>
              <button className="close-button" onClick={() => { setShowAddModal(false); setShowImageManager(false); }}>×</button>
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
                          {toFriendlyPartTypeLabel(type.name)}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand Quality</label>
                  <select
                    value={formData.quality_type}
                    onChange={(e) => setFormData({ ...formData, quality_type: e.target.value })}
                  >
                    <option value="unknown">Unspecified</option>
                    <option value="genuine">Genuine / OEM</option>
                    <option value="aftermarket">Aftermarket</option>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Overstock Level (Max)</label>
                  <input
                    type="number"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                  />
                  <small>Alert when stock exceeds this</small>
                </div>
              </div>

              <div className="form-group">
                <label>Size / Dimension Spec</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder={activeTab === 'spare-parts' ? 'Example: 70/90-17 (Front Tire)' : 'Example: L x W x H'}
                />
                <small>
                  For tires, enter actual tire size (e.g., 80/90-17, 90/80-14) so products stay clearly differentiated.
                </small>
              </div>

              <div className="form-group">
                <label>Product Photos (maximum 3)</label>
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
                {uploadingImage && <small>Uploading image...</small>}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_universal}
                    onChange={(e) => setFormData({
                      ...formData,
                      is_universal: e.target.checked,
                      compatible_bike_models: e.target.checked ? '' : formData.compatible_bike_models
                    })}
                  />
                  {' '}Universal Fit (works with all brands)
                </label>
              </div>

              <div className="form-group">
                <button
                  type="button"
                  className="inventory-see-more-btn"
                  onClick={() => setShowFitmentOptions((prev) => !prev)}
                >
                  {showFitmentOptions ? 'Hide fitment/options' : 'Show fitment/options'}
                </button>
              </div>

              {showFitmentOptions && (
                <>
                  <div className="form-group">
                    <label>Compatible Motorcycle Models</label>
                    <textarea
                      placeholder={'Yamaha Aerox 155cc\nYamaha NMAX 155cc\nHonda Beat 110cc'}
                      value={formData.compatible_bike_models}
                      onChange={(e) => setFormData({ ...formData, compatible_bike_models: e.target.value })}
                      disabled={formData.is_universal}
                      rows={4}
                    />
                    <small>
                      Enter one model per line. This connects directly to customer motorcycle filters.
                    </small>
                  </div>

                  {activeTab === 'accessories' && (
                    <>
                      <div className="form-group">
                        <label>Available Sizes (Accessories)</label>
                        <textarea
                          placeholder={'S\nM\nL\nXL'}
                          value={formData.available_sizes}
                          onChange={(e) => setFormData({ ...formData, available_sizes: e.target.value })}
                          rows={3}
                        />
                        <small>One size per line. Saved and reusable for size-based display/filtering.</small>
                      </div>

                      <div className="form-group">
                        <label>Available Colors (Accessories)</label>
                        <textarea
                          placeholder={'Black\nRed\nBlue'}
                          value={formData.available_colors}
                          onChange={(e) => setFormData({ ...formData, available_colors: e.target.value })}
                          rows={3}
                        />
                        <small>One color per line for proper product variation setup.</small>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="form-actions">
                <button type="button" className="form-button cancel" onClick={() => { setShowAddModal(false); setShowImageManager(false); }}>
                  Cancel
                </button>
                <button type="submit" className="form-button submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingProduct ? 'Update' : 'Add')} Product
                </button>
              </div>
            </form>

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
                          type="text"
                          placeholder="https://..."
                          value={formData[fieldName] || ''}
                          onChange={(e) => {
                            const nextUrl = e.target.value;
                            setFormData((prev) => ({ ...prev, [fieldName]: nextUrl }));
                            setUploadedImagePaths((prev) => ({
                              ...prev,
                              [fieldName]: extractStoragePathFromUrl(nextUrl)
                            }));
                          }}
                        />

                        <div className="photo-upload-row">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, fieldName)}
                            disabled={uploadingImage}
                          />
                          <button
                            type="button"
                            className="form-button cancel"
                            onClick={() => handleRemoveImage(fieldName)}
                            disabled={uploadingImage || !formData[fieldName]}
                          >
                            Remove Photo {index + 1}
                          </button>
                        </div>

                        <div className="photo-preview-box">
                          {isImageUrl(formData[fieldName]) ? (
                            <img src={formData[fieldName]} alt={`Preview ${index + 1}`} className="photo-preview-image" />
                          ) : (
                            <span className="photo-preview-fallback">No photo selected</span>
                          )}
                        </div>
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
        </div>
      )}
    </AdminLayout>
  );
};

export default InventoryPage;
