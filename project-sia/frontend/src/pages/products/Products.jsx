import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../Auth/modal/AuthModal';
import Toast from '../../components/toast/Toast';
import StorageUtils from '../../utils/storageUtils';
import './Products.css';

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

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
        const firstToken = lower.split(/\s+/)[0]?.replace(/[^a-z0-9-]/g, '') || '';
        const invalidTokens = ['for', 'all', 'any', 'universal', 'model', 'models', 'fit', 'fits'];
        const inferredFromToken = firstToken && !invalidTokens.includes(firstToken) ? firstToken : '';
        const inferredBrand = knownBrand || inferredFromToken || 'unknown';
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
  };

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [strictSearch, setStrictSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [activeBikeBrand, setActiveBikeBrand] = useState('all');
  const [activeBikeModel, setActiveBikeModel] = useState('all');
  const [activeBikeCcRange, setActiveBikeCcRange] = useState('all');
  const [activeBrandPreference, setActiveBrandPreference] = useState('all');
  const [bikeProfileReady, setBikeProfileReady] = useState(false);
  const [activeSizeSpec, setActiveSizeSpec] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on mount
    return StorageUtils.getFromLocalStorage('cart', []);
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedCompatibilityKey, setExpandedCompatibilityKey] = useState('');
  const [productsFromAPI, setProductsFromAPI] = useState([]);
  const [motorcycleBrandNames, setMotorcycleBrandNames] = useState([]);
  const [allBrandNames, setAllBrandNames] = useState([]);
  const [brandQuickSearch, setBrandQuickSearch] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [activeFilterNav, setActiveFilterNav] = useState('motorcycle');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Ref to track if we're updating from external source (to prevent loop)
  const isExternalUpdate = useRef(false);
  const filterSectionRefs = useRef({});
  
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const registerFilterSection = (key) => (node) => {
    if (node) {
      filterSectionRefs.current[key] = node;
    }
  };

  const jumpToFilterSection = (key) => {
    setActiveFilterNav(key);
    const sectionNode = filterSectionRefs.current[key];
    if (sectionNode) {
      sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCompatibilitySummary = (product) => {
    if (product?.isUniversal) {
      return { summary: 'Universal fit', full: 'Universal fit', extraCount: 0 };
    }

    const models = Array.isArray(product?.compatibilityModels) ? product.compatibilityModels : [];
    const modelNames = Array.from(new Set(models.map((m) => String(m?.modelName || '').trim()).filter(Boolean)));
    if (modelNames.length > 0) {
      const preview = modelNames.slice(0, 2).join(', ');
      const extraCount = Math.max(modelNames.length - 2, 0);
      return {
        summary: extraCount > 0 ? `${preview} +${extraCount} more` : preview,
        full: modelNames.join(', '),
        extraCount,
      };
    }

    const brandName = String(product?.brandName || '').trim();
    const matchedBikeBrand = motorcycleBrandNames.find((brand) =>
      brandName.toLowerCase().includes(String(brand || '').toLowerCase())
    );
    if (matchedBikeBrand) {
      return { summary: `For ${matchedBikeBrand}`, full: `For ${matchedBikeBrand}`, extraCount: 0 };
    }

    return { summary: 'Compatibility not set', full: 'Compatibility not set', extraCount: 0 };
  };

  // Listen for cart updates from other components (like CartModal deletions)
  useEffect(() => {
    const handleCartUpdate = () => {
      const updatedCart = StorageUtils.getFromLocalStorage('cart', []);
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
    StorageUtils.setToLocalStorage('cart', cart);
    // Dispatch custom event to notify FloatingCart
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  // Fetch products from API on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const parsed = StorageUtils.getFromLocalStorage('customerBikeProfile', null);
    if (parsed?.bikeBrand) {
      setActiveBikeBrand(parsed.bikeBrand);
      setActiveBikeModel(parsed.bikeModel || 'all');
      setActiveBikeCcRange(parsed.bikeCcRange || 'all');
      setActiveBrandPreference(parsed.brandPreference || 'all');
      setBikeProfileReady(true);
    }
  }, []);

  useEffect(() => {
    // Auto-apply bike filters like search controls and keep profile synced.
    const hasBikeSelection =
      activeBikeBrand !== 'all' ||
      activeBikeModel !== 'all' ||
      activeBikeCcRange !== 'all' ||
      activeBrandPreference !== 'all';

    setBikeProfileReady(hasBikeSelection);

    if (hasBikeSelection) {
      StorageUtils.setToLocalStorage('customerBikeProfile', {
        bikeBrand: activeBikeBrand,
        bikeModel: activeBikeModel,
        bikeCcRange: activeBikeCcRange,
        brandPreference: activeBrandPreference,
      });
    }
  }, [activeBikeBrand, activeBikeModel, activeBikeCcRange, activeBrandPreference]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const category = params.get('category');
    const brand = params.get('brand');
    const bikeBrand = params.get('bikeBrand');

    if (category && ['all', 'parts', 'accessories'].includes(category)) {
      setActiveCategory(category);
    }

    if (brand) {
      setActiveBrand(brand);
    }

    if (bikeBrand) {
      setActiveBikeBrand(bikeBrand);
      setBikeProfileReady(true);
      setActiveBikeModel('all');
      setActiveBikeCcRange('all');
      setActiveBrandPreference('all');
    }
  }, [location.search]);

  const fetchProducts = async () => {
    try {
      console.log('🛍️ Fetching products from API...');
      const [productsResponse, brandsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/products`),
        fetch(`${BACKEND_URL}/api/inventory/brands`)
      ]);

      const data = await productsResponse.json();
      const brandsData = await brandsResponse.json();

      const dbBrandNames = Array.isArray(brandsData?.data?.motorcycle)
        ? brandsData.data.motorcycle.map((b) => String(b?.name || '').trim()).filter(Boolean)
        : [];
      const dbSparepartBrandNames = Array.isArray(brandsData?.data?.sparepart)
        ? brandsData.data.sparepart.map((b) => String(b?.name || '').trim()).filter(Boolean)
        : [];
      const dbAccessoryBrandNames = Array.isArray(brandsData?.data?.accessory)
        ? brandsData.data.accessory.map((b) => String(b?.name || '').trim()).filter(Boolean)
        : [];
      const dbBrandSlugs = dbBrandNames.map((name) => slugify(name));
      setAllBrandNames(Array.from(new Set([
        ...dbSparepartBrandNames,
        ...dbAccessoryBrandNames
      ])));
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('✅ Products loaded from API:', data.data.length);
        // Transform API data to match existing structure
        const transformedProducts = data.data.map(product => {
          const emoji = getProductEmoji(product.name, product.part_type_name, product.product_type);
          console.log('🔍 Product:', product.name, '| Emoji:', emoji, '| Type:', product.product_type);
          const imageCandidates = [product.image_url, product.image_2, product.image_3]
            .map((url) => String(url || '').trim())
            .filter((url) => /^https?:\/\//i.test(url));
          const imageUrl = imageCandidates[0] || '';
          const brandName = product.brand_name || product.brand_code || 'Unknown';
          const brandKey = slugify(brandName) || 'unknown';
          const partTypeName = product.part_type_name || product.part_type?.name || 'Other';
          const partTypeKey = slugify(partTypeName) || 'other';
          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.selling_price || 0),
            category: product.category === 'accessory' ? 'accessories' : 'parts',
            brand: brandKey,
            brandName,
            partType: partTypeKey,
            partTypeName,
            partTypeLabel: toFriendlyPartTypeLabel(partTypeName),
            image: imageUrl || emoji,
            images: imageCandidates.length ? imageCandidates : [emoji],
            rating: parseFloat(product.rating || 0),
            stock: product.stock_quantity || 0,
            description: product.description || 'No description available',
            sku: product.sku,
            isUniversal: Boolean(product.is_universal),
            compatibilityModels: parseCompatibilityList(product.compatible_bike_models, dbBrandSlugs.length ? dbBrandSlugs : knownBikeBrands),
            dimensions: product.dimensions || '',
            qualityType: String(product.quality_type || 'unknown').toLowerCase(),
            productType: product.product_type
          };
        });
        
        const fallbackBikeBrands = Array.from(new Set(
          transformedProducts
            .flatMap((p) => p.compatibilityModels || [])
            .map((m) => String(m?.brandName || '').trim())
            .filter((name) => name && name.toLowerCase() !== 'unknown')
        ));

        setMotorcycleBrandNames(
          Array.from(new Set([...dbBrandNames, ...fallbackBikeBrands]))
        );

        setProductsFromAPI(transformedProducts);
      } else {
        console.log('⚠️ No products returned from API');
        setMotorcycleBrandNames(dbBrandNames);
        setProductsFromAPI([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setProductsFromAPI([]);
    } finally {
      setLoading(false);
    }
  };

  // Always use backend products for system-wide consistency.
  const products = productsFromAPI;

  const categories = [
    { id: 'all', name: 'All Products', icon: '🏍️' },
    { id: 'parts', name: 'Spare Parts', icon: '⚙️' },
    { id: 'accessories', name: 'Accessories', icon: '🛡️' },
  ];

  const brands = [
    { id: 'all', name: 'All Brands', icon: '🏍️' },
    ...Array.from(new Set(allBrandNames.filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: slugify(name), name, icon: '🏷️' })),
  ];

  const brandSearchText = brandQuickSearch.trim().toLowerCase();
  const filteredBrands = brands.filter((brand) => {
    if (!brandSearchText) return true;
    return String(brand.name || '').toLowerCase().includes(brandSearchText);
  });
  const compactBrandLimit = 8;
  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, compactBrandLimit);

  const partTypes = [
    { id: 'all', name: 'All Types' },
    ...Array.from(new Set(products.map((p) => p.partTypeName).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: slugify(name), name: toFriendlyPartTypeLabel(name) })),
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

  const [activePartType, setActivePartType] = useState('all');

  const handleApplyBikeProfile = () => {
    localStorage.setItem('customerBikeProfile', JSON.stringify({
      bikeBrand: activeBikeBrand,
      bikeModel: activeBikeModel,
      bikeCcRange: activeBikeCcRange,
      brandPreference: activeBrandPreference,
    }));

    if (activeBrandPreference === 'genuine' && activeBikeBrand !== 'all') {
      setActiveBrand(activeBikeBrand);
    }

    showToast('Profile saved. Filters are already applied automatically.', 'success');
  };

  // Filter and search logic
  const filteredProducts = products.filter(product => {
    const search = searchQuery.toLowerCase().trim();
    const searchableFields = [
      String(product.name || '').toLowerCase().trim(),
      String(product.description || '').toLowerCase().trim(),
      String(product.sku || '').toLowerCase().trim(),
      String(product.brandName || '').toLowerCase().trim(),
      String(product.partTypeName || '').toLowerCase().trim(),
      String(product.dimensions || '').toLowerCase().trim()
    ];
    const matchesSearch =
      search === '' ||
      (strictSearch
        ? searchableFields.some((field) => field === search)
        : searchableFields.some((field) => field.includes(search)));
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesBrand = activeBrand === 'all' || product.brand === activeBrand;
    const matchesPartType = activePartType === 'all' || product.partType === activePartType;
    const matchesSizeSpec = activeSizeSpec === 'all' || slugify(product.dimensions) === activeSizeSpec;
    const hasMotorcycleFilter = activeBikeBrand !== 'all' || activeBikeModel !== 'all' || activeBikeCcRange !== 'all';
    const compatibilityModels = product.compatibilityModels || [];
    const brandLooksLikeBikeBrand = activeBikeBrand !== 'all' && String(product.brand || '').includes(activeBikeBrand);

    const matchesBikeBrand =
      activeBikeBrand === 'all' ||
      compatibilityModels.some((m) => m.brandSlug === activeBikeBrand) ||
      (compatibilityModels.length === 0 && brandLooksLikeBikeBrand);
    const matchesBikeModel = activeBikeModel === 'all' || compatibilityModels.some((m) => m.modelSlug === activeBikeModel);
    const matchesBikeCc = activeBikeCcRange === 'all' || compatibilityModels.some((m) => ccMatchesRange(m.cc, activeBikeCcRange));
    const matchesMotorcycle = !hasMotorcycleFilter || product.isUniversal || (matchesBikeBrand && matchesBikeModel && matchesBikeCc);

    const sameAsBikeBrand = activeBikeBrand !== 'all' && (product.brand === activeBikeBrand || brandLooksLikeBikeBrand);
    const qualityType = product.qualityType || 'unknown';
    const aftermarket = qualityType === 'aftermarket' || (qualityType === 'unknown' && product.brand !== 'unknown' && !sameAsBikeBrand);
    const matchesBrandPreference =
      activeBrandPreference === 'all' ||
      (activeBrandPreference === 'genuine' && (qualityType === 'genuine' || sameAsBikeBrand || product.isUniversal)) ||
      (activeBrandPreference === 'aftermarket' && aftermarket);
    
    let matchesPrice = true;
    if (priceRange === 'under500') matchesPrice = product.price < 500;
    if (priceRange === '500-1000') matchesPrice = product.price >= 500 && product.price <= 1000;
    if (priceRange === '1000-2000') matchesPrice = product.price >= 1000 && product.price <= 2000;
    if (priceRange === 'over2000') matchesPrice = product.price > 2000;

    return matchesSearch && matchesCategory && matchesBrand && matchesPartType && matchesSizeSpec && matchesPrice && matchesMotorcycle && matchesBrandPreference;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // featured (default order)
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
    console.log('🛒 handleAddToCart called with product:', product);
    console.log('🔐 isAuthenticated:', isAuthenticated());
    
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }

    const availableStock = Number(product?.stock || 0);
    if (availableStock <= 0) {
      showToast(`${product?.name || 'This item'} is out of stock.`, 'warning');
      return;
    }
    
    const productKey = `${product.productType || product.category || 'product'}-${product.id}`;
    setCart((prevCart) => {
      console.log('📦 Current cart before adding:', prevCart);
      const existingItem = prevCart.find(item => (item.cart_key || `${item.productType || item.category || 'product'}-${item.id}`) === productKey);
      if (existingItem) {
        const updatedCart = prevCart.map(item =>
          (item.cart_key || `${item.productType || item.category || 'product'}-${item.id}`) === productKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        console.log('➕ Increasing quantity, new cart:', updatedCart);
        showToast(`Increased ${product.name} quantity in cart!`, 'success');
        return updatedCart;
      }

      const newCart = [...prevCart, { ...product, cart_key: productKey, quantity: 1 }];
      console.log('✨ Adding new item, new cart:', newCart);
      showToast(`Added ${product.name} to cart!`, 'success');
      return newCart;
    });
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
          <nav className="filters-quick-nav" aria-label="Quick filter navigation">
            <button
              type="button"
              className={`filters-nav-btn ${activeFilterNav === 'motorcycle' ? 'active' : ''}`}
              onClick={() => jumpToFilterSection('motorcycle')}
            >
              Motorcycle
            </button>
            <button
              type="button"
              className={`filters-nav-btn ${activeFilterNav === 'search' ? 'active' : ''}`}
              onClick={() => jumpToFilterSection('search')}
            >
              Search
            </button>
            <button
              type="button"
              className={`filters-nav-btn ${activeFilterNav === 'category' ? 'active' : ''}`}
              onClick={() => jumpToFilterSection('category')}
            >
              Category
            </button>
            <button
              type="button"
              className={`filters-nav-btn ${activeFilterNav === 'brand' ? 'active' : ''}`}
              onClick={() => jumpToFilterSection('brand')}
            >
              Brand
            </button>
            <button
              type="button"
              className={`filters-nav-btn ${activeFilterNav === 'more' ? 'active' : ''}`}
              onClick={() => jumpToFilterSection('more')}
            >
              More
            </button>
          </nav>

          <div className="filter-section" ref={registerFilterSection('motorcycle')}>
            <h3>Your Motorcycle</h3>
            <small style={{ display: 'block', marginBottom: '8px' }}>
              Set this first so the system can auto-filter compatible spare parts and accessories.
            </small>
            <select
              value={activeBikeBrand}
              onChange={(e) => {
                setActiveBikeBrand(e.target.value);
                setActiveBikeModel('all');
              }}
              className="filter-select"
            >
              {motorcycleBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <select
              value={activeBikeModel}
              onChange={(e) => {
                setActiveBikeModel(e.target.value);
              }}
              className="filter-select"
              style={{ marginTop: '0.5rem' }}
              disabled={activeBikeBrand === 'all'}
            >
              {motorcycleModels.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <select
              value={activeBikeCcRange}
              onChange={(e) => {
                setActiveBikeCcRange(e.target.value);
              }}
              className="filter-select"
              style={{ marginTop: '0.5rem' }}
            >
              <option value="all">All Engine CC</option>
              <option value="under125">Under 125cc</option>
              <option value="125-155">125cc to 155cc</option>
              <option value="156-200">156cc to 200cc</option>
              <option value="over200">Over 200cc</option>
            </select>

            <select
              value={activeBrandPreference}
              onChange={(e) => {
                setActiveBrandPreference(e.target.value);
              }}
              className="filter-select"
              style={{ marginTop: '0.5rem' }}
            >
              <option value="all">Any Brand Preference</option>
              <option value="genuine">Genuine / Same bike brand</option>
              <option value="aftermarket">Aftermarket (RCB/CNC/etc.)</option>
            </select>

            <button
              className="clear-filters-btn"
              style={{ marginTop: '0.75rem', background: '#198754' }}
              onClick={handleApplyBikeProfile}
            >
              Apply Motorcycle Profile
            </button>
          </div>

          <div className="filter-section" ref={registerFilterSection('search')}>
            <h3>🔍 Search</h3>
            <input
              type="text"
              placeholder="Search by name, SKU, brand, part type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={strictSearch}
                onChange={(e) => setStrictSearch(e.target.checked)}
              />
              Exact match only
            </label>
          </div>

          <div className="filter-section" ref={registerFilterSection('category')}>
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

          <details className="filter-section filter-accordion" open ref={registerFilterSection('brand')}>
            <summary>
              <span>🏷️ Brand</span>
              <span className="accordion-hint">{activeBrand === 'all' ? 'All' : 'Filtered'}</span>
            </summary>
            <div className="accordion-body">
              <input
                type="text"
                placeholder="Quick search brand..."
                value={brandQuickSearch}
                onChange={(e) => {
                  setBrandQuickSearch(e.target.value);
                  setShowAllBrands(false);
                }}
                className="search-input"
              />
              <div className="brand-options-wrap">
                {visibleBrands.map((brand) => (
                  <button
                    key={brand.id}
                    className={`filter-option ${activeBrand === brand.id ? 'active' : ''}`}
                    onClick={() => setActiveBrand(brand.id)}
                  >
                    <span>{brand.icon}</span> {brand.name}
                  </button>
                ))}
              </div>
              {filteredBrands.length > compactBrandLimit && (
                <button
                  className="filter-more-btn"
                  onClick={() => setShowAllBrands((prev) => !prev)}
                >
                  {showAllBrands ? 'Show Fewer Brands' : `Show All Brands (${filteredBrands.length})`}
                </button>
              )}
            </div>
          </details>

          <details className="filter-section filter-accordion" ref={registerFilterSection('more')}>
            <summary>
              <span>🧰 More Filters</span>
              <span className="accordion-hint">Advanced</span>
            </summary>
            <div className="accordion-body filter-grid-compact">
              <div>
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

              <div>
                <h3>📏 Size / Spec</h3>
                <select
                  value={activeSizeSpec}
                  onChange={(e) => setActiveSizeSpec(e.target.value)}
                  className="filter-select"
                >
                  {sizeSpecs.map((size) => (
                    <option key={size.id} value={size.id}>{size.name}</option>
                  ))}
                </select>
              </div>

              <div>
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
            </div>
          </details>

          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setStrictSearch(false);
              setActiveCategory('all');
              setActiveBrand('all');
              setActivePartType('all');
              setActiveSizeSpec('all');
              setActiveBikeBrand('all');
              setActiveBikeModel('all');
              setActiveBikeCcRange('all');
              setActiveBrandPreference('all');
              setBikeProfileReady(false);
              setPriceRange('all');
              setSortBy('featured');
              setActiveFilterNav('motorcycle');
              localStorage.removeItem('customerBikeProfile');
            }}
          >
            Clear All Filters
          </button>
        </aside>

        {/* Products Grid Section */}
        <main className="products-main">
          {!bikeProfileReady && (
            <div className="products-header" style={{ marginBottom: '16px', background: '#fff8e1', border: '1px solid #ffd54f' }}>
              <div className="results-info">
                <h2 style={{ marginBottom: '6px' }}>Set Your Motorcycle First</h2>
                <p style={{ margin: 0, color: '#8a6d3b' }}>
                  Select the brand/model/cc and brand preference first so that the correct compatible parts will appear
                </p>
              </div>
            </div>
          )}

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
              {sortedProducts.map((product) => (
                <div key={`${product.productType}-${product.id}`} className="product-card">
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
                    <div className="product-sku">{product.sku}</div>
                    <h3 className="product-name">{product.name}</h3>
                    {Number(product.rating || 0) > 0 ? (
                      <div className="product-rating">
                        <span className="stars">{'⭐'.repeat(Math.floor(product.rating))}</span>
                        <span className="rating-value">({product.rating})</span>
                      </div>
                    ) : (
                      <div className="product-rating">
                        {(() => {
                          const compatibility = getCompatibilitySummary(product);
                          const compatibilityKey = `${product.productType}-${product.id}`;
                          const isExpanded = expandedCompatibilityKey === compatibilityKey;
                          const displayText = isExpanded ? compatibility.full : compatibility.summary;

                          return (
                            <>
                              <span className="rating-value">{displayText}</span>
                              {compatibility.extraCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedCompatibilityKey(isExpanded ? '' : compatibilityKey)}
                                  style={{
                                    marginLeft: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#4f46e5',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {isExpanded ? 'show less' : `+${compatibility.extraCount} more`}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    <div className="product-footer">
                      <span className="product-price">₱{product.price.toLocaleString()}</span>
                      <span className={`product-stock ${product.stock < 20 ? 'low' : ''}`}>
                        {product.stock < 20 ? '⚠️ Low Stock' : `✓ ${product.stock} in stock`}
                      </span>
                    </div>
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={Number(product.stock || 0) <= 0}
                    >
                      {Number(product.stock || 0) <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
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
                  {String(selectedProduct.images[currentImageIndex] || '').startsWith('http') ? (
                    <img
                      className="main-image-photo"
                      src={selectedProduct.images[currentImageIndex]}
                      alt={selectedProduct.name}
                    />
                  ) : (
                    <span className="main-image-emoji">{selectedProduct.images[currentImageIndex]}</span>
                  )}
                  
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
                        {String(img || '').startsWith('http') ? (
                          <img className="thumbnail-photo" src={img} alt={`${selectedProduct.name} thumbnail ${index + 1}`} />
                        ) : (
                          <span className="thumbnail-emoji">{img}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-details">
                <div className="modal-sku">{selectedProduct.sku}</div>
                <h2 className="modal-product-name">{selectedProduct.name}</h2>
                
                {Number(selectedProduct.rating || 0) > 0 ? (
                  <div className="modal-rating">
                    <span className="stars">{'⭐'.repeat(Math.floor(selectedProduct.rating))}</span>
                    <span className="rating-value">({selectedProduct.rating})</span>
                  </div>
                ) : (
                  <div className="modal-rating">
                    <span className="rating-value">{getCompatibilitySummary(selectedProduct).summary}</span>
                  </div>
                )}

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
                    <span className="info-value">{selectedProduct.brandName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Part Type:</span>
                    <span className="info-value">{selectedProduct.partTypeLabel || selectedProduct.partTypeName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size / Spec:</span>
                    <span className="info-value">{selectedProduct.dimensions || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Compatibility:</span>
                    <span className="info-value">{getCompatibilitySummary(selectedProduct).full}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="add-to-cart-btn modal-cart-btn"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      closeQuickView();
                    }}
                    disabled={Number(selectedProduct.stock || 0) <= 0}
                  >
                    {Number(selectedProduct.stock || 0) <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                  </button>
                  <button 
                    className="buy-now-btn"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      closeQuickView();
                    }}
                    disabled={Number(selectedProduct.stock || 0) <= 0}
                  >
                    {Number(selectedProduct.stock || 0) <= 0 ? 'Out of Stock' : '⚡ Buy Now'}
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
