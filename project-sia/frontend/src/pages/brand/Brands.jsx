import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Brands.css';

const Brands = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  const slugify = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const motorcycleBrands = [
    {
      id: 1,
      name: 'Honda',
      logo: '🔴',
      description: 'Japanese manufacturer known for reliability and innovation',
      products: 'Engines, Brake Systems, Electrical Parts, Body Parts',
      established: '1948',
      country: 'Japan'
    },
    {
      id: 2,
      name: 'Suzuki',
      logo: '🔵',
      description: 'Leading motorcycle manufacturer with sports and commuter bikes',
      products: 'Engine Parts, Clutch Systems, Fuel Systems, Suspension',
      established: '1909',
      country: 'Japan'
    },
    {
      id: 3,
      name: 'Yamaha',
      logo: '⚫',
      description: 'Premium motorcycles combining performance and style',
      products: 'Performance Parts, Engine Components, Exhaust Systems',
      established: '1955',
      country: 'Japan'
    },
    {
      id: 4,
      name: 'Kawasaki',
      logo: '🟢',
      description: 'High-performance motorcycles and racing heritage',
      products: 'Racing Parts, Engine Systems, Drivetrain Components',
      established: '1896',
      country: 'Japan'
    },
  ];

  const partsBrands = [
    {
      id: 5,
      name: 'NGK',
      logo: '⚡',
      description: 'World leader in spark plugs and ignition systems',
      products: 'Spark Plugs, Ignition Coils, Oxygen Sensors',
      specialty: 'Ignition Systems'
    },
    {
      id: 6,
      name: 'Brembo',
      logo: '🔴',
      description: 'Premium brake systems for high performance',
      products: 'Brake Discs, Calipers, Brake Pads, Master Cylinders',
      specialty: 'Brake Systems'
    },
    {
      id: 7,
      name: 'K&N',
      logo: '🌬️',
      description: 'High-flow air filters and intake systems',
      products: 'Air Filters, Intake Kits, Oil Filters',
      specialty: 'Filtration'
    },
    {
      id: 8,
      name: 'DID',
      logo: '⛓️',
      description: 'Premium motorcycle chains and drive systems',
      products: 'Chains, Sprockets, Drive Kits',
      specialty: 'Drivetrain'
    },
    {
      id: 9,
      name: 'IRC',
      logo: '⭕',
      description: 'Quality motorcycle tires for all conditions',
      products: 'Street Tires, Off-road Tires, Racing Tires',
      specialty: 'Tires'
    },
    {
      id: 10,
      name: 'Denso',
      logo: '💡',
      description: 'Advanced automotive technology and components',
      products: 'Fuel Injectors, Sensors, Electrical Components',
      specialty: 'Electronics'
    },
    {
      id: 11,
      name: 'Motolite',
      logo: '🔋',
      description: 'Reliable motorcycle batteries and electrical systems',
      products: 'Batteries, Starters, Alternators',
      specialty: 'Electrical'
    },
  ];

  const accessoryBrands = [
    {
      id: 12,
      name: 'Shoei',
      logo: '🪖',
      description: 'Premium safety helmets with advanced protection',
      products: 'Full-face Helmets, Open-face Helmets, Modular Helmets',
      specialty: 'Helmets'
    },
    {
      id: 13,
      name: 'Alpinestars',
      logo: '🧤',
      description: 'Professional motorcycle gear and protective equipment',
      products: 'Gloves, Jackets, Boots, Protective Armor',
      specialty: 'Riding Gear'
    },
    {
      id: 14,
      name: 'Progrip',
      logo: '🎯',
      description: 'Quality handlebar grips and controls',
      products: 'Handlebar Grips, Bar Ends, Throttle Tubes',
      specialty: 'Controls'
    },
    {
      id: 15,
      name: 'Givi',
      logo: '📦',
      description: 'Motorcycle luggage and storage solutions',
      products: 'Top Cases, Side Cases, Tank Bags, Mounting Systems',
      specialty: 'Luggage'
    },
    {
      id: 16,
      name: 'Oxford',
      logo: '🔒',
      description: 'Motorcycle security and accessories',
      products: 'Locks, Covers, Hand Guards, Heated Grips',
      specialty: 'Accessories'
    },
  ];

  const categories = [
    { id: 'all', name: 'All Brands', icon: '🏍️' },
    { id: 'motorcycle', name: 'Motorcycle Brands', icon: '🏍️' },
    { id: 'parts', name: 'Parts Manufacturers', icon: '⚙️' },
    { id: 'accessories', name: 'Accessory Brands', icon: '🛡️' },
  ];

  const getFilteredBrands = () => {
    if (activeCategory === 'all') {
      return [...motorcycleBrands, ...partsBrands, ...accessoryBrands];
    } else if (activeCategory === 'motorcycle') {
      return motorcycleBrands;
    } else if (activeCategory === 'parts') {
      return partsBrands;
    } else if (activeCategory === 'accessories') {
      return accessoryBrands;
    }
    return [];
  };

  const filteredBrands = getFilteredBrands();

  const getBrandCategory = (brandId) => {
    if (motorcycleBrands.some((b) => b.id === brandId)) return 'motorcycle';
    if (partsBrands.some((b) => b.id === brandId)) return 'parts';
    if (accessoryBrands.some((b) => b.id === brandId)) return 'accessories';
    return 'all';
  };

  const handleViewProducts = (brand) => {
    const brandType = getBrandCategory(brand.id);
    const params = new URLSearchParams();

    if (brandType === 'motorcycle') {
      params.set('bikeBrand', slugify(brand.name));
    } else {
      params.set('brand', slugify(brand.name));
      if (brandType === 'parts' || brandType === 'accessories') {
        params.set('category', brandType);
      }
    }

    navigate(`/products?${params.toString()}`);
  };

  return (
    <div className="brands-page">
      <div className="brands-hero">
        <h1>Our Trusted Brands</h1>
        <p>We partner with the world's leading motorcycle and parts manufacturers</p>
      </div>

      <div className="brands-container">
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="tab-icon">{cat.icon}</span>
              <span className="tab-name">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="brands-grid">
          {filteredBrands.map(brand => (
            <div key={brand.id} className="brand-card">
              <div className="brand-header">
                <div className="brand-logo">{brand.logo}</div>
                <div className="brand-title">
                  <h3>{brand.name}</h3>
                  {brand.specialty && (
                    <span className="brand-specialty">{brand.specialty}</span>
                  )}
                  {brand.country && (
                    <span className="brand-country">📍 {brand.country} • Est. {brand.established}</span>
                  )}
                </div>
              </div>

              <p className="brand-description">{brand.description}</p>

              <div className="brand-products">
                <h4>Available Products:</h4>
                <p>{brand.products}</p>
              </div>

              <button className="view-products-btn" onClick={() => handleViewProducts(brand)}>
                View Products →
              </button>
            </div>
          ))}
        </div>

        <div className="brands-stats">
          <div className="stat-box">
            <div className="stat-icon">🏍️</div>
            <div className="stat-content">
              <h3>4</h3>
              <p>Motorcycle Brands</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">⚙️</div>
            <div className="stat-content">
              <h3>7</h3>
              <p>Parts Manufacturers</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <h3>5</h3>
              <p>Accessory Brands</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>100%</h3>
              <p>Genuine Products</p>
            </div>
          </div>
        </div>

        <div className="why-choose-section">
          <h2>Why Choose Our Brands?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">✓</div>
              <h3>Genuine Products</h3>
              <p>All products are 100% genuine and come with manufacturer warranty</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3>Premium Quality</h3>
              <p>We only partner with world-renowned brands trusted by millions</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔧</div>
              <h3>Expert Support</h3>
              <p>Get professional advice on choosing the right parts for your bike</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <h3>Wide Selection</h3>
              <p>Comprehensive range of parts and accessories for all brands</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;
