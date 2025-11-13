import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import SkeletonLoader from '../SkeletonLoader';
import './BrandsManagement.css';

const BACKEND_URL = 'http://localhost:5174';

const BrandsManagement = () => {
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [response] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/brands`),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      const data = await response.json();

      if (data.success) {
        setBrands(data.data || {});
      } else {
        setError('Failed to fetch brands');
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const renderBrandCategory = (categoryKey, categoryLabel, brandList) => {
    // Check if brandList is an array of objects or a simple object
    const isArrayOfObjects = Array.isArray(brandList);
    const isObjectWithObjects = !isArrayOfObjects && brandList && typeof brandList === 'object';
    
    return (
      <div className="brand-category" key={categoryKey}>
        <h3>{categoryLabel}</h3>
        <div className="brand-grid">
          {isArrayOfObjects ? (
            // If it's an array of brand objects
            brandList.map((brand) => (
              <div className="brand-card" key={brand.id || brand.code}>
                <div className="brand-icon">{brand.logo_emoji || '🏷️'}</div>
                <div className="brand-info">
                  <h4>{brand.name}</h4>
                  <p className="brand-code">Code: {brand.code}</p>
                  {brand.country && <p className="brand-country">Country: {brand.country}</p>}
                </div>
              </div>
            ))
          ) : isObjectWithObjects ? (
            // If it's an object where values might be objects
            Object.entries(brandList).map(([key, value]) => {
              // Check if value is an object (full brand data) or just a string (brand name)
              const isObject = typeof value === 'object' && value !== null;
              const brandName = isObject ? value.name : value;
              const brandCode = isObject ? value.code : key;
              const brandEmoji = isObject ? value.logo_emoji : '🏷️';
              const brandCountry = isObject ? value.country : null;
              
              return (
                <div className="brand-card" key={key}>
                  <div className="brand-icon">{brandEmoji}</div>
                  <div className="brand-info">
                    <h4>{brandName}</h4>
                    <p className="brand-code">Code: {brandCode}</p>
                    {brandCountry && <p className="brand-country">Country: {brandCountry}</p>}
                  </div>
                </div>
              );
            })
          ) : (
            <p>No brands found</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) return (
    <AdminLayout title="Brands Management" description="Manage product brands and categories">
      <SkeletonLoader type="content" rows={6} />
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout title="Brands Management" description="Manage product brands and categories">
      <div className="error">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Brands Management" description="Manage product brands and categories">
      <div className="inventory-container">
        <div className="inventory-header">
          <h2>Brands Management</h2>
          <p className="subtitle">Motorcycle, spare parts, and accessories brands</p>
        </div>

        <div className="brands-content">
          {brands.motorcycle && renderBrandCategory('motorcycle', 'Motorcycle Brands', brands.motorcycle)}
          {brands.sparepart && renderBrandCategory('sparepart', 'Spare Parts Brands', brands.sparepart)}
          {brands.accessory && renderBrandCategory('accessory', 'Accessories Brands', brands.accessory)}
        </div>

        <style>{`
          .brands-content {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .brand-category {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid #f0f0f0;
          }

          .brand-category h3 {
            font-size: 1.3rem;
            color: #2c3e50;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #667eea;
          }

          .brand-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }

          .brand-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .brand-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.15);
            border-color: #667eea;
          }

          .brand-icon {
            font-size: 2rem;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 10px;
            flex-shrink: 0;
          }

          .brand-info {
            flex: 1;
          }

          .brand-info h4 {
            margin: 0;
            color: #2c3e50;
            font-size: 1rem;
            font-weight: 600;
          }

          .brand-code {
            margin: 0.25rem 0 0 0;
            color: #7f8c8d;
            font-size: 0.85rem;
            font-family: monospace;
          }

          .brand-country {
            margin: 0.25rem 0 0 0;
            color: #95a5a6;
            font-size: 0.8rem;
            font-style: italic;
          }

          .subtitle {
            color: #7f8c8d;
            font-size: 0.95rem;
            margin-top: 0.5rem;
          }

          @media (max-width: 768px) {
            .brand-grid {
              grid-template-columns: 1fr;
            }

            .brand-category {
              padding: 1.5rem 1rem;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default BrandsManagement;
