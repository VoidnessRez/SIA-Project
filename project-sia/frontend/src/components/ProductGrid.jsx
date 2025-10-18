import React, { useState } from 'react';
import './ProductGrid.css';

const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const products = [
    { 
      id: 1, 
      name: 'Brake Pads', 
      price: '₱850', 
      category: 'parts', 
      brand: 'honda', 
      image: '🛑', 
      images: ['🛑', '🔴', '⚫'],
      rating: 4.8, 
      stock: 45,
      description: 'High-quality brake pads for Honda motorcycles. Provides excellent stopping power and durability.'
    },
    { 
      id: 2, 
      name: 'Engine Oil Filter', 
      price: '₱320', 
      category: 'parts', 
      brand: 'suzuki', 
      image: '🛢️', 
      images: ['🛢️', '⚙️', '🔵'],
      rating: 4.6, 
      stock: 60,
      description: 'Premium oil filter for Suzuki engines. Ensures clean oil circulation and engine protection.'
    },
    { 
      id: 3, 
      name: 'Spark Plug', 
      price: '₱180', 
      category: 'parts', 
      brand: 'yamaha', 
      image: '⚡', 
      images: ['⚡', '🔌', '⚫'],
      rating: 4.7, 
      stock: 80,
      description: 'High-performance spark plug for Yamaha motorcycles. Improves ignition and fuel efficiency.'
    },
    { 
      id: 4, 
      name: 'Chain Sprocket Set', 
      price: '₱1,850', 
      category: 'parts', 
      brand: 'kawasaki', 
      image: '⛓️', 
      images: ['⛓️', '⚙️', '🟢'],
      rating: 4.9, 
      stock: 25,
      description: 'Complete chain and sprocket set for Kawasaki bikes. Durable and long-lasting performance.'
    },
    { 
      id: 5, 
      name: 'Air Filter', 
      price: '₱450', 
      category: 'parts', 
      brand: 'honda', 
      image: '🌬️', 
      images: ['🌬️', '💨', '🔴'],
      rating: 4.5, 
      stock: 50,
      description: 'Quality air filter for optimal engine performance. Keeps your engine breathing clean air.'
    },
    { 
      id: 6, 
      name: 'Handlebar Grips', 
      price: '₱280', 
      category: 'accessories', 
      brand: 'all', 
      image: '🎯', 
      images: ['🎯', '🖐️', '⚫'],
      rating: 4.3, 
      stock: 70,
      description: 'Comfortable handlebar grips with anti-slip design. Universal fit for all motorcycle brands.'
    },
    { 
      id: 7, 
      name: 'Side Mirror', 
      price: '₱650', 
      category: 'accessories', 
      brand: 'suzuki', 
      image: '🪞', 
      images: ['🪞', '👁️', '🔵'],
      rating: 4.4, 
      stock: 35,
      description: 'High-quality side mirror with wide viewing angle. Perfect replacement for Suzuki motorcycles.'
    },
    { 
      id: 8, 
      name: 'Helmet', 
      price: '₱2,500', 
      category: 'accessories', 
      brand: 'all', 
      image: '🪖', 
      images: ['🪖', '🛡️', '⚫', '🔴'],
      rating: 4.9, 
      stock: 20,
      description: 'Safety-certified full-face helmet. Available in multiple colors with superior impact protection.'
    },
    { 
      id: 9, 
      name: 'Clutch Cable', 
      price: '₱380', 
      category: 'parts', 
      brand: 'yamaha', 
      image: '🔗', 
      images: ['🔗', '⚙️', '⚫'],
      rating: 4.6, 
      stock: 40,
      description: 'Durable clutch cable for smooth gear shifting. Designed specifically for Yamaha models.'
    },
    { 
      id: 10, 
      name: 'Battery 12V', 
      price: '₱1,200', 
      category: 'parts', 
      brand: 'kawasaki', 
      image: '🔋', 
      images: ['🔋', '⚡', '🟢'],
      rating: 4.8, 
      stock: 30,
      description: '12V maintenance-free battery. Reliable starting power for Kawasaki motorcycles.'
    },
    { 
      id: 11, 
      name: 'LED Headlight', 
      price: '₱1,800', 
      category: 'accessories', 
      brand: 'all', 
      image: '💡', 
      images: ['💡', '✨', '🌟'],
      rating: 4.7, 
      stock: 25,
      description: 'Bright LED headlight with low power consumption. Universal fit with easy installation.'
    },
    { 
      id: 12, 
      name: 'Tire Set', 
      price: '₱3,200', 
      category: 'parts', 
      brand: 'honda', 
      image: '⭕', 
      images: ['⭕', '🔴', '⚫'],
      rating: 4.9, 
      stock: 15,
      description: 'Premium tire set with excellent grip and durability. Front and rear tires for Honda bikes.'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'parts', name: 'Spare Parts' },
    { id: 'accessories', name: 'Accessories' },
  ];

  const brands = [
    { id: 'all', name: 'All Brands', icon: '🏍️' },
    { id: 'honda', name: 'Honda', icon: '🔴' },
    { id: 'suzuki', name: 'Suzuki', icon: '🔵' },
    { id: 'yamaha', name: 'Yamaha', icon: '⚫' },
    { id: 'kawasaki', name: 'Kawasaki', icon: '🟢' },
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesBrand = activeBrand === 'all' || product.brand === activeBrand || product.brand === 'all';
    return matchesCategory && matchesBrand;
  });

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
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
          <button className="view-all-btn">View All Products →</button>
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
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <span className="product-emoji">{product.image}</span>
                <div className="product-overlay">
                  <button className="quick-view-btn" onClick={() => openQuickView(product)}>
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
                  <span className="product-price">{product.price}</span>
                  <span className="product-stock">Stock: {product.stock}</span>
                </div>
                <button className="add-to-cart-btn">Add to Cart</button>
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
                    <span className="main-image-emoji">
                      {selectedProduct.images[currentImageIndex]}
                    </span>
                    
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
                          <span className="thumbnail-emoji">{img}</span>
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

                  <div className="modal-price">{selectedProduct.price}</div>

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
                      <span className="info-value">{selectedProduct.brand.charAt(0).toUpperCase() + selectedProduct.brand.slice(1)}</span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="add-to-cart-btn modal-cart-btn">
                      🛒 Add to Cart
                    </button>
                    <button className="buy-now-btn">
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;