import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../Auth/modal/AuthModal';
import './ProductGrid.css';

const BACKEND_URL = 'http://localhost:5174';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const knownBikeBrands = ['yamaha', 'honda', 'suzuki', 'kawasaki', 'ktm', 'ducati', 'bmw'];

const toTitle = (value) => {
  const text = String(value || '').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
};

const parseCompatibilityList = (rawValue, knownBrandSlugs = knownBikeBrands) => {
  if (!rawValue) return [];

  let list = [];
  if (Array.isArray(rawValue)) {
    list = rawValue;
  } else if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed || trimmed === '[]' || trimmed.toLowerCase() === 'null') return [];

    try {
      const parsed = JSON.parse(trimmed);
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = trimmed.split(/[\n,;]+/).map((v) => v.trim()).filter(Boolean);
    }
  }

  return list
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .map((label) => {
      const lower = label.toLowerCase();
      const knownBrand = knownBrandSlugs.find((b) => lower.includes(b));
      const inferredBrand = knownBrand || 'unknown';
      const brandSlug = slugify(inferredBrand || 'unknown');
      const brandName = inferredBrand === 'unknown' ? 'Unknown' : toTitle(inferredBrand);
      const ccMatch = label.match(/(\d{2,4})\s*cc?/i) || label.match(/\b(\d{2,4})\b/);
      const cc = ccMatch ? parseInt(ccMatch[1], 10) : null;
      const modelWithoutBrand = (brandName === 'Unknown' ? label : label.replace(new RegExp(`^${brandName}\\s+`, 'i'), ''))
        .replace(/\b\d{2,4}\s*cc?\b/gi, '')
        .trim();

      return {
        label,
        brandSlug,
        brandName,
        modelSlug: slugify(modelWithoutBrand || label),
        modelName: modelWithoutBrand || label,
        cc,
      };
    });
};

const ccMatchesRange = (ccValue, range) => {
  if (range === 'all') return true;
  if (!ccValue || Number.isNaN(ccValue)) return false;
  if (range === 'under125') return ccValue < 125;
  if (range === '125-155') return ccValue >= 125 && ccValue <= 155;
  if (range === '156-200') return ccValue >= 156 && ccValue <= 200;
  if (range === 'over200') return ccValue > 200;
  return true;
};

const getProductEmoji = (name, partTypeName, productType) => {
  const nameLower = (name || '').toLowerCase();
  const partTypeLower = (partTypeName || '').toLowerCase();

  if (nameLower.includes('brake') || partTypeLower.includes('brake')) return '🛑';
  if (nameLower.includes('filter') || partTypeLower.includes('filter')) return '🌬️';
  if (nameLower.includes('spark') || nameLower.includes('plug') || partTypeLower.includes('plug')) return '⚡';
  if (nameLower.includes('battery') || partTypeLower.includes('battery')) return '🔋';
  if (nameLower.includes('oil') || partTypeLower.includes('oil')) return '🛢️';
  if (nameLower.includes('wheel') || nameLower.includes('tire')) return '⭕';
  if (productType === 'accessory') return '🛡️';
  return '⚙️';
};

const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [activeBikeBrand, setActiveBikeBrand] = useState('all');
  const [activeBikeModel, setActiveBikeModel] = useState('all');
  const [activeBikeCcRange, setActiveBikeCcRange] = useState('all');
  const [activeBrandPreference, setActiveBrandPreference] = useState('all');
  const [activeSizeSpec, setActiveSizeSpec] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [motorcycleBrandNames, setMotorcycleBrandNames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const rawProfile = localStorage.getItem('customerBikeProfile');
    if (!rawProfile) return;

    try {
      const parsed = JSON.parse(rawProfile);
      if (parsed?.bikeBrand && parsed?.bikeModel) {
        setActiveBikeBrand(parsed.bikeBrand);
        setActiveBikeModel(parsed.bikeModel);
        setActiveBikeCcRange(parsed.bikeCcRange || 'all');
        setActiveBrandPreference(parsed.brandPreference || 'all');
      }
    } catch (profileErr) {
      console.warn('Failed to load saved bike profile:', profileErr);
    }
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const [productsResponse, brandsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/products`),
        fetch(`${BACKEND_URL}/api/inventory/brands`)
      ]);

      const result = await productsResponse.json();
      const brandsResult = await brandsResponse.json();

      const dbBrandNames = Array.isArray(brandsResult?.data?.motorcycle)
        ? brandsResult.data.motorcycle.map((b) => String(b?.name || '').trim()).filter(Boolean)
        : [];
      const dbBrandSlugs = dbBrandNames.map((name) => slugify(name));
      setMotorcycleBrandNames(dbBrandNames);

      if (!result.success || !Array.isArray(result.data)) {
        setProducts([]);
        return;
      }

      const transformed = result.data.slice(0, 12).map((product) => {
        const imageCandidates = [product.image_url, product.image_2, product.image_3]
          .map((url) => String(url || '').trim())
          .filter((url) => /^https?:\/\//i.test(url));
        const image = imageCandidates[0] || getProductEmoji(product.name, product.part_type_name, product.product_type);
        const brandName = product.brand_name || product.brand_code || 'Unknown';
        return {
          id: product.id,
          name: product.name,
          price: Number(product.selling_price || 0),
          category: product.product_type === 'accessory' ? 'accessories' : 'parts',
          brand: slugify(brandName) || 'unknown',
          brandName,
          image,
          images: imageCandidates.length ? imageCandidates : [image],
          rating: Number(product.rating || 4.5),
          stock: Number(product.stock_quantity || 0),
          description: product.description || 'No description available',
          dimensions: product.dimensions || '',
          qualityType: String(product.quality_type || 'unknown').toLowerCase(),
          isUniversal: Boolean(product.is_universal),
          compatibilityModels: parseCompatibilityList(product.compatible_bike_models, dbBrandSlugs.length ? dbBrandSlugs : knownBikeBrands)
        };
      });

      setProducts(transformed);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'parts', name: 'Spare Parts' },
    { id: 'accessories', name: 'Accessories' },
  ];

  const brands = [
    { id: 'all', name: 'All Brands', icon: '🏍️' },
    ...Array.from(new Set(products.map((p) => p.brandName).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: slugify(name), name, icon: '🏷️' })),
  ];

  const motorcycleBrands = [
    { id: 'all', name: 'All Motorcycle Brands' },
    ...Array.from(new Set(motorcycleBrandNames))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: slugify(name), name })),
  ];

  const motorcycleModels = activeBikeBrand === 'all'
    ? [{ id: 'all', name: 'Select motorcycle brand first' }]
    : [
        { id: 'all', name: 'All Motorcycle Models' },
        ...Array.from(new Set(
          products.flatMap((p) => (p.compatibilityModels || [])
            .filter((m) => m.brandSlug === activeBikeBrand)
            .map((m) => m.modelName))
        ))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ id: slugify(name), name })),
      ];

  const sizeSpecs = [
    { id: 'all', name: 'All Sizes / Specs' },
    ...Array.from(new Set(products.map((p) => String(p.dimensions || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: slugify(name), name })),
  ];

  const handleApplyBikeProfile = () => {
    if (activeBikeBrand === 'all') {
      alert('Please select your motorcycle brand first.');
      return;
    }

    localStorage.setItem('customerBikeProfile', JSON.stringify({
      bikeBrand: activeBikeBrand,
      bikeModel: activeBikeModel,
      bikeCcRange: activeBikeCcRange,
      brandPreference: activeBrandPreference,
    }));

    if (activeBrandPreference === 'genuine') {
      setActiveBrand(activeBikeBrand);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesBrand = activeBrand === 'all' || product.brand === activeBrand;
    const matchesSizeSpec = activeSizeSpec === 'all' || slugify(product.dimensions) === activeSizeSpec;

    const hasMotorcycleFilter = activeBikeBrand !== 'all' || activeBikeModel !== 'all' || activeBikeCcRange !== 'all';
    const compatibilityModels = product.compatibilityModels || [];

    const matchesBikeBrand = activeBikeBrand === 'all' || compatibilityModels.some((m) => m.brandSlug === activeBikeBrand);
    const matchesBikeModel = activeBikeModel === 'all' || compatibilityModels.some((m) => m.modelSlug === activeBikeModel);
    const matchesBikeCc = activeBikeCcRange === 'all' || compatibilityModels.some((m) => ccMatchesRange(m.cc, activeBikeCcRange));
    const matchesMotorcycle = !hasMotorcycleFilter || product.isUniversal || (matchesBikeBrand && matchesBikeModel && matchesBikeCc);

    const sameAsBikeBrand = activeBikeBrand !== 'all' && product.brand === activeBikeBrand;
    const qualityType = product.qualityType || 'unknown';
    const aftermarket = qualityType === 'aftermarket' || (qualityType === 'unknown' && product.brand !== 'unknown' && !sameAsBikeBrand);
    const matchesBrandPreference =
      activeBrandPreference === 'all' ||
      (activeBrandPreference === 'genuine' && (qualityType === 'genuine' || sameAsBikeBrand || product.isUniversal)) ||
      (activeBrandPreference === 'aftermarket' && aftermarket);

    return matchesCategory && matchesBrand && matchesSizeSpec && matchesMotorcycle && matchesBrandPreference;
  });

  const handleQuickView = (product) => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    
    // Get current cart from localStorage
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Check if product already exists in cart
    const productKey = `${product.productType || product.category || 'product'}-${product.id}`;
    const existingItem = cart.find(item => (item.cart_key || `${item.productType || item.category || 'product'}-${item.id}`) === productKey);
    
    let updatedCart;
    if (existingItem) {
      // Increase quantity
      updatedCart = cart.map(item => 
        (item.cart_key || `${item.productType || item.category || 'product'}-${item.id}`) === productKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      alert(`Increased ${product.name} quantity in cart!`);
    } else {
      // Add new item with quantity 1
      // Parse price if it's a string
      const price = Number(product.price || 0);
      
      updatedCart = [...cart, { 
        ...product, 
        cart_key: productKey,
        price: price,
        quantity: 1 
      }];
      alert(`Added ${product.name} to cart!`);
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Dispatch event to update FloatingCart immediately
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const closeQuickView = () => {
    setSelectedProduct(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedProduct && selectedProduct.images) {
      setCurrentImageIndex((prev) => 
        prev === selectedProduct.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProduct && selectedProduct.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProduct.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <section className="product-section">
      <div className="container">
        <div className="section-header">
          <h2>Featured Products</h2>
          <button className="view-all-btn" onClick={() => navigate('/products')}>View All Products →</button>
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="brand-filters">
          <label className="filter-label" style={{ marginBottom: '0.75rem' }}>1) Set your motorcycle profile first</label>
          <div className="bike-filters" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
            <select
              className="bike-filter-select"
              value={activeBikeBrand}
              onChange={(e) => {
                setActiveBikeBrand(e.target.value);
                setActiveBikeModel('all');
              }}
            >
              {motorcycleBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <select
              className="bike-filter-select"
              value={activeBikeModel}
              onChange={(e) => {
                setActiveBikeModel(e.target.value);
              }}
              disabled={activeBikeBrand === 'all'}
            >
              {motorcycleModels.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>

            <select
              className="bike-filter-select"
              value={activeBikeCcRange}
              onChange={(e) => {
                setActiveBikeCcRange(e.target.value);
              }}
            >
              <option value="all">All Engine CC</option>
              <option value="under125">Under 125cc</option>
              <option value="125-155">125cc to 155cc</option>
              <option value="156-200">156cc to 200cc</option>
              <option value="over200">Over 200cc</option>
            </select>

            <select
              className="bike-filter-select"
              value={activeBrandPreference}
              onChange={(e) => {
                setActiveBrandPreference(e.target.value);
              }}
            >
              <option value="all">Any Brand Preference</option>
              <option value="genuine">Genuine / Same bike brand</option>
              <option value="aftermarket">Aftermarket (RCB/CNC/etc.)</option>
            </select>
          </div>

          <button className="filter-btn" onClick={handleApplyBikeProfile}>Apply Motorcycle Profile</button>

          <label className="filter-label"></label>
          <div className="brand-buttons">
            {brands.map(brand => (
              <button
                key={brand.id}
                className={`brand-btn ${activeBrand === brand.id ? 'active' : ''}`}
                onClick={() => setActiveBrand(brand.id)}
              >
                <span className="brand-icon">{brand.icon}</span>
                {brand.name}
              </button>
            ))}
          </div>

          <div className="bike-filters">
            <select
              className="bike-filter-select"
              value={activeBikeBrand}
              onChange={(e) => {
                setActiveBikeBrand(e.target.value);
                setActiveBikeModel('all');
              }}
            >
              {motorcycleBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>

            <select
              className="bike-filter-select"
              value={activeBikeModel}
              onChange={(e) => {
                setActiveBikeModel(e.target.value);
              }}
              disabled={activeBikeBrand === 'all'}
            >
              {motorcycleModels.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>

            <select
              className="bike-filter-select"
              value={activeBikeCcRange}
              onChange={(e) => {
                setActiveBikeCcRange(e.target.value);
              }}
            >
              <option value="all">All Engine CC</option>
              <option value="under125">Under 125cc</option>
              <option value="125-155">125cc to 155cc</option>
              <option value="156-200">156cc to 200cc</option>
              <option value="over200">Over 200cc</option>
            </select>

            <select
              className="bike-filter-select"
              value={activeSizeSpec}
              onChange={(e) => setActiveSizeSpec(e.target.value)}
            >
              {sizeSpecs.map((size) => (
                <option key={size.id} value={size.id}>{size.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="products-grid">
          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p>No products available right now.</p>
          ) : filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {String(product.image || '').startsWith('http') ? (
                  <img className="product-photo" src={product.image} alt={product.name} />
                ) : (
                  <div className="product-emoji">{product.image || '⚙️'}</div>
                )}
                <div className="product-overlay">
                  <button className="quick-view-btn" onClick={() => handleQuickView(product)}>
                    Quick View
                  </button>
                </div>
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-rating">
                  <span className="stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
                  <span className="rating-value">({product.rating})</span>
                </div>
                <div className="product-footer">
                  <span className="product-price">₱{Number(product.price || 0).toLocaleString()}</span>
                  <span className="product-stock">Stock: {product.stock}</span>
                </div>
                <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick View Modal */}
        {selectedProduct && (
          <div className="quick-view-modal" onClick={closeQuickView}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={closeQuickView}>✕</button>
              
              <div className="modal-body">
                {/* Image Gallery Section */}
                <div className="modal-gallery">
                  <div className="main-image">
                    {String(selectedProduct.images[currentImageIndex] || '').startsWith('http') ? (
                      <img className="main-image-photo" src={selectedProduct.images[currentImageIndex]} alt={selectedProduct.name} />
                    ) : (
                      <span className="main-image-emoji">{selectedProduct.images[currentImageIndex]}</span>
                    )}
                    
                    {selectedProduct.images.length > 1 && (
                      <>
                        <button className="gallery-btn prev" onClick={prevImage}>
                          ‹
                        </button>
                        <button className="gallery-btn next" onClick={nextImage}>
                          ›
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Image Thumbnails */}
                  {selectedProduct.images.length > 1 && (
                    <div className="image-thumbnails">
                      {selectedProduct.images.map((img, index) => (
                        <div
                          key={index}
                          className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          {String(img || '').startsWith('http') ? (
                            <img className="thumbnail-photo" src={img} alt={`${selectedProduct.name} ${index + 1}`} />
                          ) : (
                            <span className="thumbnail-emoji">{img}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Image Counter */}
                  {selectedProduct.images.length > 1 && (
                    <div className="image-counter">
                      {currentImageIndex + 1} / {selectedProduct.images.length}
                    </div>
                  )}
                </div>

                {/* Product Details Section */}
                <div className="modal-details">
                  <h2 className="modal-product-name">{selectedProduct.name}</h2>
                  
                  <div className="modal-rating">
                    <span className="stars">{'⭐'.repeat(Math.floor(selectedProduct.rating))}</span>
                    <span className="rating-value">({selectedProduct.rating})</span>
                  </div>

                  <div className="modal-price">₱{Number(selectedProduct.price || 0).toLocaleString()}</div>

                  <div className="modal-stock">
                    <span className={selectedProduct.stock > 20 ? 'in-stock' : 'low-stock'}>
                      {selectedProduct.stock > 20 ? '✓ In Stock' : '⚠ Low Stock'}
                    </span>
                    <span className="stock-count">{selectedProduct.stock} units available</span>
                  </div>

                  <div className="modal-description">
                    <h3>Product Description</h3>
                    <p>{selectedProduct.description}</p>
                  </div>

                  <div className="modal-info">
                    <div className="info-item">
                      <span className="info-label">Category:</span>
                      <span className="info-value">{selectedProduct.category === 'parts' ? 'Spare Parts' : 'Accessories'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Brand:</span>
                      <span className="info-value">{selectedProduct.brandName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Size / Spec:</span>
                      <span className="info-value">{selectedProduct.dimensions || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="add-to-cart-btn modal-cart-btn" onClick={() => handleAddToCart(selectedProduct)}>
                      🛒 Add to Cart
                    </button>
                    <button className="buy-now-btn" onClick={() => handleAddToCart(selectedProduct)}>
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    </section>
  );
};

export default ProductGrid;