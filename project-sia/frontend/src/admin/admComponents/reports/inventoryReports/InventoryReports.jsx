import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './InventoryReports.css';

function InventoryReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, spare-parts, accessories
  const [stockFilter, setStockFilter] = useState('all'); // all, low-stock, out-of-stock, in-stock

  // Fetch inventory report data
  const fetchInventoryReport = async () => {
    try {
      setLoading(true);

      // Fetch all products
      let query = supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      const { data: products, error } = await query;

      if (error) throw error;

      // Apply filters
      let filteredProducts = products || [];

      // Category filter
      if (categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
      }

      // Stock filter
      if (stockFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const stock = p.stock_quantity || 0;
          const lowStockThreshold = p.low_stock_threshold || 10;
          
          if (stockFilter === 'out-of-stock') return stock === 0;
          if (stockFilter === 'low-stock') return stock > 0 && stock <= lowStockThreshold;
          if (stockFilter === 'in-stock') return stock > lowStockThreshold;
          return true;
        });
      }

      // Calculate metrics
      const totalProducts = filteredProducts.length;
      const totalValue = filteredProducts.reduce((sum, p) => 
        sum + (p.stock_quantity || 0) * parseFloat(p.price || 0), 0
      );
      const lowStockCount = filteredProducts.filter(p => {
        const stock = p.stock_quantity || 0;
        const threshold = p.low_stock_threshold || 10;
        return stock > 0 && stock <= threshold;
      }).length;
      const outOfStockCount = filteredProducts.filter(p => 
        (p.stock_quantity || 0) === 0
      ).length;

      // Category breakdown
      const categoryBreakdown = {};
      filteredProducts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        if (!categoryBreakdown[cat]) {
          categoryBreakdown[cat] = {
            category: cat,
            count: 0,
            value: 0
          };
        }
        categoryBreakdown[cat].count += 1;
        categoryBreakdown[cat].value += (p.stock_quantity || 0) * parseFloat(p.price || 0);
      });

      const categoryData = Object.values(categoryBreakdown);

      // Brand breakdown
      const brandBreakdown = {};
      filteredProducts.forEach(p => {
        const brand = p.brand || 'Unknown';
        if (!brandBreakdown[brand]) {
          brandBreakdown[brand] = {
            brand,
            count: 0,
            value: 0
          };
        }
        brandBreakdown[brand].count += 1;
        brandBreakdown[brand].value += (p.stock_quantity || 0) * parseFloat(p.price || 0);
      });

      const brandData = Object.values(brandBreakdown)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setReportData({
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
        products: filteredProducts,
        categoryData,
        brandData
      });

    } catch (error) {
      console.error('Error fetching inventory report:', error);
      // alert('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData || !reportData.products) return;

    const headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Stock', 'Price', 'Total Value'];
    const rows = reportData.products.map(p => [
      p.name || 'N/A',
      p.sku || 'N/A',
      p.category || 'N/A',
      p.brand || 'N/A',
      p.stock_quantity || 0,
      `₱${parseFloat(p.price || 0).toFixed(2)}`,
      `₱${((p.stock_quantity || 0) * parseFloat(p.price || 0)).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${Date.now()}.csv`;
    a.click();
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchInventoryReport();
  }, [categoryFilter, stockFilter]);

  return (
    <AdminLayout>
      <div className="inventory-reports-container">
        <div className="reports-header">
          <h1>Inventory Reports</h1>
          {!loading && (
            <div className="reports-actions">
              <button className="export-btn" onClick={exportToCSV}>
                📥 Export CSV
              </button>
              <button className="print-btn" onClick={handlePrint}>
                🖨️ Print
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {!loading && (
          <div className="reports-controls">
            <div className="filter-group">
              <label>Category:</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="spare-parts">Spare Parts</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Stock Status:</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="reports-summary">
            <div className="summary-card">
              <div className="summary-label">Total Products</div>
              <div className="summary-value">{reportData?.totalProducts}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Inventory Value</div>
              <div className="summary-value">₱{reportData?.totalValue.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Low Stock Items</div>
              <div className="summary-value warning">{reportData?.lowStockCount}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Out of Stock</div>
              <div className="summary-value danger">{reportData?.outOfStockCount}</div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="report-section">
          <h2>Category Breakdown</h2>
          <div className="report-table-container">
            {loading ? (
              <SkeletonLoader />
            ) : reportData?.categoryData.length === 0 ? (
              <div className="no-data">
                <p>No inventory data available</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Product Count</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.categoryData.map((cat, index) => (
                    <tr key={index}>
                      <td className="category-name">{cat.category}</td>
                      <td>{cat.count}</td>
                      <td className="value">₱{cat.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Brands by Value */}
        <div className="report-section">
          <h2>Top Brands by Inventory Value</h2>
          <div className="report-table-container">
            {loading ? (
              <SkeletonLoader />
            ) : reportData?.brandData.length === 0 ? (
              <div className="no-data">
                <p>No brand data available</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Brand</th>
                    <th>Product Count</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.brandData.map((brand, index) => (
                    <tr key={index}>
                      <td className="rank">{index + 1}</td>
                      <td className="brand-name">{brand.brand}</td>
                      <td>{brand.count}</td>
                      <td className="value">₱{brand.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="report-section">
          <h2>Product Inventory</h2>
          <div className="report-table-container">
            {loading ? (
              <SkeletonLoader />
            ) : reportData?.products.length === 0 ? (
              <div className="no-data">
                <p>No products found</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.products.map((product) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td>{product.sku || 'N/A'}</td>
                      <td>{product.category || 'N/A'}</td>
                      <td>{product.brand || 'N/A'}</td>
                      <td className={
                        (product.stock_quantity || 0) === 0 ? 'stock-danger' :
                        (product.stock_quantity || 0) <= (product.low_stock_threshold || 10) ? 'stock-warning' :
                        'stock-ok'
                      }>
                        {product.stock_quantity || 0}
                      </td>
                      <td>₱{parseFloat(product.price || 0).toFixed(2)}</td>
                      <td className="value">₱{((product.stock_quantity || 0) * parseFloat(product.price || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default InventoryReports;
