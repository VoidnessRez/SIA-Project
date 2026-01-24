import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './SalesReports.css';

function SalesReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, last3Months, thisYear
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, spare-parts, accessories

  // Fetch sales report data
  const fetchSalesReport = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'last3Months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Fetch completed orders with items
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(*)),
          profiles(full_name, email)
        `)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString());

      const { data: orders, error } = await query;

      if (error) throw error;

      // Process data
      let filteredOrders = orders || [];
      
      // Apply category filter
      if (categoryFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
          order.order_items.some(item => 
            item.products?.category === categoryFilter
          )
        );
      }

      // Calculate metrics
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const totalOrders = filteredOrders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top selling products
      const productSales = {};
      filteredOrders.forEach(order => {
        order.order_items.forEach(item => {
          const productName = item.products?.name || 'Unknown';
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.quantity * parseFloat(item.price || 0);
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Daily sales breakdown
      const dailySales = {};
      filteredOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        if (!dailySales[date]) {
          dailySales[date] = {
            date,
            revenue: 0,
            orders: 0
          };
        }
        dailySales[date].revenue += parseFloat(order.total_amount || 0);
        dailySales[date].orders += 1;
      });

      const salesByDay = Object.values(dailySales).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      setReportData({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topProducts,
        salesByDay,
        orders: filteredOrders
      });

    } catch (error) {
      console.error('Error fetching sales report:', error);
      // alert('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData || !reportData.orders) return;

    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total Amount', 'Payment Method'];
    const rows = reportData.orders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleDateString(),
      order.profiles?.full_name || 'N/A',
      order.order_items.length,
      `₱${parseFloat(order.total_amount || 0).toFixed(2)}`,
      order.payment_method || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange}-${Date.now()}.csv`;
    a.click();
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange, categoryFilter]);

  return (
    <AdminLayout>
      <div className="sales-reports-container">
        <div className="reports-header">
          <h1>Sales Reports</h1>
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
              <label>Date Range:</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="spare-parts">Spare Parts</option>
                <option value="accessories">Accessories</option>
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
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value">₱{reportData?.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Orders</div>
              <div className="summary-value">{reportData?.totalOrders}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg Order Value</div>
              <div className="summary-value">₱{reportData?.avgOrderValue.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Top Products */}
        <div className="report-section">
          <h2>Top Selling Products</h2>
          <div className="report-table-container">
            {loading ? (
              <SkeletonLoader />
            ) : reportData?.topProducts.length === 0 ? (
              <div className="no-data">
                <p>No sales data available</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="rank">{index + 1}</td>
                      <td className="product-name">{product.name}</td>
                      <td>{product.quantity}</td>
                      <td className="revenue">₱{product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Daily Sales Breakdown */}
        <div className="report-section">
          <h2>Daily Sales Breakdown</h2>
          <div className="report-table-container">
            {loading ? (
              <SkeletonLoader />
            ) : reportData?.salesByDay.length === 0 ? (
              <div className="no-data">
                <p>No sales data available</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.salesByDay.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>{day.orders}</td>
                      <td className="revenue">₱{day.revenue.toFixed(2)}</td>
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

export default SalesReports;
