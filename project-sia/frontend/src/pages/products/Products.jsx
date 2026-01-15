import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../Auth/modal/AuthModal';
import Toast from '../../components/toast/Toast';
import './Products.css';

  const BACKEND_URL = 'http://localhost:5174';

  // Product emoji mapping based on name/type
  const getProductEmoji = (name, partTypeName, productType) => {
    const nameLower = (name || '').toLowerCase();
    const partTypeLower = (partTypeName || '').toLowerCase();
    
    if (nameLower.includes('brake') || partTypeLower.includes('brake')) return '🛑';
    if (nameLower.includes('filter') || partTypeLower.includes('filter')) return '🌬️';
    if (nameLower.includes('spark') || nameLower.includes('plug') || partTypeLower.includes('plug')) return '⚡';
    if (nameLower.includes('battery') || partTypeLower.includes('battery')) return '🔋';
    if (nameLower.includes('oil') || partTypeLower.includes('oil')) return '🛢️';
    if (nameLower.includes('mat') || nameLower.includes('floor')) return '🟫';
    if (nameLower.includes('wheel') || nameLower.includes('steering')) return '🎡';
    if (nameLower.includes('freshener') || nameLower.includes('air')) return '🌬️';
    if (productType === 'accessory') return '🎁';
    return '⚙️';
  };const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [productsFromAPI, setProductsFromAPI] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useAPIData, setUseAPIData] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Ref to track if we're updating from external source (to prevent loop)
  const isExternalUpdate = useRef(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Listen for cart updates from other components (like CartModal deletions)
  useEffect(() => {
    const handleCartUpdate = () => {
      const savedCart = localStorage.getItem('cart');
      const updatedCart = savedCart ? JSON.parse(savedCart) : [];
      console.log('🔄 Cart updated from localStorage:', updatedCart);
      isExternalUpdate.current = true; // Mark as external update
      setCart(updatedCart);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    // Skip saving if this was triggered by external update
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }
    
    console.log('💾 Saving cart to localStorage:', cart);
    localStorage.setItem('cart', JSON.stringify(cart));
    // Dispatch custom event to notify FloatingCart
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  // Fetch products from API on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('🛍️ Fetching products from API...');
      const response = await fetch(`${BACKEND_URL}/api/inventory/products`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('✅ Products loaded from API:', data.data.length);
        // Transform API data to match existing structure
        const transformedProducts = data.data.map(product => {
          const emoji = getProductEmoji(product.name, product.part_type_name, product.product_type);
          console.log('🔍 Product:', product.name, '| Emoji:', emoji, '| Type:', product.product_type);
          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || 0),
            category: product.category === 'accessory' ? 'accessories' : 'parts',
            brand: product.brand_code?.toLowerCase() || 'universal',
            partType: product.part_type?.code || 'other',
            image: emoji,
            images: [emoji, emoji, emoji],
            rating: parseFloat(product.rating || 0),
            stock: product.stock_quantity || 0,
            description: product.description || 'No description available',
            sku: product.sku,
            brandName: product.brand_name,
            partTypeName: product.part_type_name,
            productType: product.product_type
          };
        });
        
        setProductsFromAPI(transformedProducts);
        setUseAPIData(true);
      } else {
        console.log('⚠️ No products from API, using mock data');
        setUseAPIData(false);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.log('⚠️ Using mock data as fallback');
      setUseAPIData(false);
    } finally {
      setLoading(false);
    }
  };

  // Mock product data (fallback if API fails)
  const mockProducts = [
    { 
      id: 1, 
      name: 'Brake Pads Set', 
      price: 850, 
      category: 'parts', 
      brand: 'honda', 
      partType: 'brake-system',
      image: '🛑', 
      images: ['🛑', '🔴', '⚫'],
      rating: 4.8, 
      stock: 45,
      description: 'High-quality brake pads for Honda motorcycles. Provides excellent stopping power and durability. Compatible with most Honda models.',
      sku: 'BRK-HON-001'
    },
    { 
      id: 2, 
      name: 'Engine Oil Filter', 
      price: 320, 
      category: 'parts', 
      brand: 'suzuki', 
      partType: 'engine',
      image: '🛢️', 
      images: ['🛢️', '⚙️', '🔵'],
      rating: 4.6, 
      stock: 60,
      description: 'Premium oil filter for Suzuki engines. Ensures clean oil circulation and engine protection.',
      sku: 'OIL-SUZ-002'
    },
    { 
      id: 3, 
      name: 'NGK Spark Plug', 
      price: 180, 
      category: 'parts', 
      brand: 'yamaha', 
      partType: 'ignition',
      image: '⚡', 
      images: ['⚡', '🔌', '⚫'],
      rating: 4.7, 
      stock: 80,
      description: 'High-performance NGK spark plug for Yamaha motorcycles. Improves ignition and fuel efficiency.',
      sku: 'SPK-YAM-003'
    },
    { 
      id: 4, 
      name: 'Chain & Sprocket Set', 
      price: 1850, 
      category: 'parts', 
      brand: 'kawasaki', 
      partType: 'drivetrain',
      image: '⛓️', 
      images: ['⛓️', '⚙️', '🟢'],
      rating: 4.9, 
      stock: 25,
      description: 'Complete DID chain and JT sprocket set for Kawasaki bikes. Durable and long-lasting performance.',
      sku: 'CHN-KAW-004'
    },
    { 
      id: 5, 
      name: 'K&N Air Filter', 
      price: 450, 
      category: 'parts', 
      brand: 'honda', 
      partType: 'intake',
      image: '🌬️', 
      images: ['🌬️', '💨', '🔴'],
      rating: 4.5, 
      stock: 50,
      description: 'K&N reusable air filter for optimal engine performance. Keeps your engine breathing clean air.',
      sku: 'AIR-HON-005'
    },
    { 
      id: 6, 
      name: 'Progrip Handlebar Grips', 
      price: 280, 
      category: 'accessories', 
      brand: 'universal', 
      partType: 'controls',
      image: '🎯', 
      images: ['🎯', '🖐️', '⚫'],
      rating: 4.3, 
      stock: 70,
      description: 'Comfortable Progrip handlebar grips with anti-slip design. Universal fit for all motorcycle brands.',
      sku: 'GRP-UNI-006'
    },
    { 
      id: 7, 
      name: 'OEM Side Mirror', 
      price: 650, 
      category: 'accessories', 
      brand: 'suzuki', 
      partType: 'body',
      image: '🪞', 
      images: ['🪞', '👁️', '🔵'],
      rating: 4.4, 
      stock: 35,
      description: 'High-quality OEM side mirror with wide viewing angle. Perfect replacement for Suzuki motorcycles.',
      sku: 'MIR-SUZ-007'
    },
    { 
      id: 8, 
      name: 'Shoei Full Face Helmet', 
      price: 2500, 
      category: 'accessories', 
      brand: 'universal', 
      partType: 'safety',
      image: '🪖', 
      images: ['🪖', '🛡️', '⚫', '🔴'],
      rating: 4.9, 
      stock: 20,
      description: 'Shoei safety-certified full-face helmet. Available in multiple colors with superior impact protection.',
      sku: 'HLM-UNI-008'
    },
    { 
      id: 9, 
      name: 'Clutch Cable', 
      price: 380, 
      category: 'parts', 
      brand: 'yamaha', 
      partType: 'controls',
      image: '🔗', 
      images: ['🔗', '⚙️', '⚫'],
      rating: 4.6, 
      stock: 40,
      description: 'Durable clutch cable for smooth gear shifting. Designed specifically for Yamaha models.',
      sku: 'CLU-YAM-009'
    },
    { 
      id: 10, 
      name: 'Motolite Battery 12V', 
      price: 1200, 
      category: 'parts', 
      brand: 'kawasaki', 
      partType: 'electrical',
      image: '🔋', 
      images: ['🔋', '⚡', '🟢'],
      rating: 4.8, 
      stock: 30,
      description: 'Motolite 12V maintenance-free battery. Reliable starting power for Kawasaki motorcycles.',
      sku: 'BAT-KAW-010'
    },
    { 
      id: 11, 
      name: 'LED Headlight Bulb', 
      price: 1800, 
      category: 'accessories', 
      brand: 'universal', 
      partType: 'lighting',
      image: '💡', 
      images: ['💡', '✨', '🌟'],
      rating: 4.7, 
      stock: 25,
      description: 'Bright LED headlight with low power consumption. Universal fit with easy installation.',
      sku: 'LED-UNI-011'
    },
    { 
      id: 12, 
      name: 'IRC Tire Set (Front+Rear)', 
      price: 3200, 
      category: 'parts', 
      brand: 'honda', 
      partType: 'wheels',
      image: '⭕', 
      images: ['⭕', '🔴', '⚫'],
      rating: 4.9, 
      stock: 15,
      description: 'Premium IRC tire set with excellent grip and durability. Front and rear tires for Honda bikes.',
      sku: 'TIR-HON-012'
    },
    { 
      id: 13, 
      name: 'Brembo Brake Disc', 
      price: 2200, 
      category: 'parts', 
      brand: 'yamaha', 
      partType: 'brake-system',
      image: '💿', 
      images: ['💿', '⚫', '⚡'],
      rating: 4.9, 
      stock: 18,
      description: 'Brembo high-performance brake disc. Superior braking performance for Yamaha sport bikes.',
      sku: 'DSC-YAM-013'
    },
    { 
      id: 14, 
      name: 'Alpinestars Riding Gloves', 
      price: 1500, 
      category: 'accessories', 
      brand: 'universal', 
      partType: 'safety',
      image: '🧤', 
      images: ['🧤', '✋', '⚫'],
      rating: 4.8, 
      stock: 35,
      description: 'Alpinestars professional riding gloves with knuckle protection and touchscreen compatibility.',
      sku: 'GLV-UNI-014'
    },
    { 
      id: 15, 
      name: 'Denso Fuel Injector', 
      price: 2800, 
      category: 'parts', 
      brand: 'suzuki', 
      partType: 'fuel-system',
      image: '💉', 
      images: ['💉', '⚙️', '🔵'],
      rating: 4.7, 
      stock: 12,
      description: 'Denso OEM fuel injector for Suzuki motorcycles. Ensures optimal fuel delivery and efficiency.',
      sku: 'INJ-SUZ-015'
    },
  ];

  // Use API data if available, otherwise use mock data
  const products = useAPIData ? productsFromAPI : mockProducts;

  const categories = [
    { id: 'all', name: 'All Products', icon: '🏍️' },
    { id: 'parts', name: 'Spare Parts', icon: '⚙️' },
    { id: 'accessories', name: 'Accessories', icon: '🛡️' },
  ];

  const brands = [
    { id: 'all', name: 'All Brands', icon: '🏍️' },
    { id: 'honda', name: 'Honda', icon: '🔴' },
    { id: 'suzuki', name: 'Suzuki', icon: '🔵' },
    { id: 'yamaha', name: 'Yamaha', icon: '⚫' },
    { id: 'kawasaki', name: 'Kawasaki', icon: '🟢' },
    { id: 'universal', name: 'Universal', icon: '⭐' },
  ];

  const partTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'brake-system', name: 'Brake System' },
    { id: 'engine', name: 'Engine Parts' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'drivetrain', name: 'Drivetrain' },
    { id: 'fuel-system', name: 'Fuel System' },
    { id: 'wheels', name: 'Wheels & Tires' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'safety', name: 'Safety Gear' },
    { id: 'body', name: 'Body Parts' },
    { id: 'controls', name: 'Controls' },
    { id: 'intake', name: 'Air Intake' },
    { id: 'ignition', name: 'Ignition' },
  ];

  const [activePartType, setActivePartType] = useState('all');

  // Filter and search logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesBrand = activeBrand === 'all' || product.brand === activeBrand;
    const matchesPartType = activePartType === 'all' || product.partType === activePartType;
    
    let matchesPrice = true;
    if (priceRange === 'under500') matchesPrice = product.price < 500;
    if (priceRange === '500-1000') matchesPrice = product.price >= 500 && product.price <= 1000;
    if (priceRange === '1000-2000') matchesPrice = product.price >= 1000 && product.price <= 2000;
    if (priceRange === 'over2000') matchesPrice = product.price > 2000;

    return matchesSearch && matchesCategory && matchesBrand && matchesPartType && matchesPrice;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured (default order)
  });

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(`${product.name} added to cart!`);
  };

  const handleQuickView = (product) => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  const handleAddToCart = (product) => {
    console.log('🛒 handleAddToCart called with product:', product);
    console.log('🔐 isAuthenticated:', isAuthenticated());
    
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }
    
    console.log('📦 Current cart before adding:', cart);
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      console.log('➕ Increasing quantity, new cart:', updatedCart);
      setCart(updatedCart);
      showToast(`Increased ${product.name} quantity in cart!`, 'success');
    } else {
      const newCart = [...cart, { ...product, quantity: 1 }];
      console.log('✨ Adding new item, new cart:', newCart);
      setCart(newCart);
      showToast(`Added ${product.name} to cart!`, 'success');
    }
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
    <div className="products-page">
      <div className="products-hero">
        <h1>Shop Motorcycle Parts & Accessories</h1>
        <p>Find genuine parts and quality accessories for your motorcycle</p>
        {loading && (
          <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'inline-block' }}>
            ⏳ Loading products...
          </div>
        )}
      </div>

      <div className="products-container">
        {/* Search and Filter Section */}
        <aside className="filters-sidebar">
          <div className="filter-section">
            <h3>🔍 Search</h3>
            <input
              type="text"
              placeholder="Search by name, SKU, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-section">
            <h3>📂 Category</h3>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-option ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          <div className="filter-section">
            <h3>🏷️ Brand</h3>
            {brands.map(brand => (
              <button
                key={brand.id}
                className={`filter-option ${activeBrand === brand.id ? 'active' : ''}`}
                onClick={() => setActiveBrand(brand.id)}
              >
                <span>{brand.icon}</span> {brand.name}
              </button>
            ))}
          </div>

          <div className="filter-section">
            <h3>🔧 Part Type</h3>
            <select 
              value={activePartType} 
              onChange={(e) => setActivePartType(e.target.value)}
              className="filter-select"
            >
              {partTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>💰 Price Range</h3>
            <select 
              value={priceRange} 
              onChange={(e) => setPriceRange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Prices</option>
              <option value="under500">Under ₱500</option>
              <option value="500-1000">₱500 - ₱1,000</option>
              <option value="1000-2000">₱1,000 - ₱2,000</option>
              <option value="over2000">Over ₱2,000</option>
            </select>
          </div>

          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
              setActiveBrand('all');
              setActivePartType('all');
              setPriceRange('all');
              setSortBy('featured');
            }}
          >
            Clear All Filters
          </button>
        </aside>

        {/* Products Grid Section */}
        <main className="products-main">
          <div className="products-header">
            <div className="results-info">
              <h2>Products ({sortedProducts.length})</h2>
            </div>
            <div className="sort-controls">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="no-results">
              <h3>😔 No products found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="products-grid">
              {sortedProducts.map((product, index) => (
                <div key={`${product.productType}-${product.id}`} className="product-card">
                  <div className="product-image">
                    <div className="product-emoji">
                      {product.image || '⚙️'}
                    </div>
                    <div className="product-overlay">
                      <button className="quick-view-btn" onClick={() => handleQuickView(product)}>
                        Quick View
                      </button>
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <div className="product-sku">{product.sku}</div>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-rating">
                      <span className="stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
                      <span className="rating-value">({product.rating})</span>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">₱{product.price.toLocaleString()}</span>
                      <span className={`product-stock ${product.stock < 20 ? 'low' : ''}`}>
                        {product.stock < 20 ? '⚠️ Low Stock' : `✓ ${product.stock} in stock`}
                      </span>
                    </div>
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      🛒 Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <div className="quick-view-modal" onClick={closeQuickView}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeQuickView}>✕</button>
            
            <div className="modal-body">
              <div className="modal-gallery">
                <div className="main-image">
                  <span className="main-image-emoji">
                    {selectedProduct.images[currentImageIndex]}
                  </span>
                  
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button className="gallery-btn prev" onClick={prevImage}>‹</button>
                      <button className="gallery-btn next" onClick={nextImage}>›</button>
                    </>
                  )}
                </div>
                
                {selectedProduct.images.length > 1 && (
                  <div className="image-thumbnails">
                    {selectedProduct.images.map((img, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <span className="thumbnail-emoji">{img}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-details">
                <div className="modal-sku">{selectedProduct.sku}</div>
                <h2 className="modal-product-name">{selectedProduct.name}</h2>
                
                <div className="modal-rating">
                  <span className="stars">{'⭐'.repeat(Math.floor(selectedProduct.rating))}</span>
                  <span className="rating-value">({selectedProduct.rating})</span>
                </div>

                <div className="modal-price">₱{selectedProduct.price.toLocaleString()}</div>

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
                    <span className="info-value">
                      {selectedProduct.category === 'parts' ? 'Spare Parts' : 'Accessories'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Brand:</span>
                    <span className="info-value">
                      {selectedProduct.brand.charAt(0).toUpperCase() + selectedProduct.brand.slice(1)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Part Type:</span>
                    <span className="info-value">
                      {partTypes.find(t => t.id === selectedProduct.partType)?.name || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="add-to-cart-btn modal-cart-btn"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      closeQuickView();
                    }}
                  >
                    🛒 Add to Cart
                  </button>
                  <button 
                    className="buy-now-btn"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      closeQuickView();
                    }}
                  >
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
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Products;
