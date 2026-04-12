import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './SalesRecords.css';

const SalesRecords = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date'); // date, amount
  const [totalRevenue, setTotalRevenue] = useState(0);

   
  useEffect(() => {
    fetchSalesRecords();
  }, [filterPeriod]);

  const fetchSalesRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch completed orders with their items
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          fulfillment_method,
          order_items (
            quantity,
            unit_price,
            subtotal,
            product_id
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Apply date filter
      if (filterPeriod !== 'all') {
        const now = new Date();
        let startDate;
        
        if (filterPeriod === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (filterPeriod === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (filterPeriod === 'month') {
          startDate = new Date(now.setDate(now.getDate() - 30));
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group sales by date
      const groupedSales = groupSalesByDate(data || []);
      setSalesData(groupedSales);
      
      // Calculate total revenue
      const total = (data || []).reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      setTotalRevenue(total);

    } catch (error) {
      console.error('Error fetching sales records:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupSalesByDate = (orders) => {
    const grouped = {};
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          orders: [],
          totalSales: 0,
          orderCount: 0
        };
      }
      
      grouped[date].orders.push(order);
      grouped[date].totalSales += parseFloat(order.total_amount || 0);
      grouped[date].orderCount += 1;
    });

    // Convert to array and sort
    const sortedGroups = Object.values(grouped).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else {
        return b.totalSales - a.totalSales;
      }
    });

    return sortedGroups;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Order Number', 'Amount', 'Method', 'Items'];
    const rows = [];

    salesData.forEach(group => {
      group.orders.forEach(order => {
        rows.push([
          new Date(order.created_at).toLocaleDateString(),
          order.order_number,
          `₱${parseFloat(order.total_amount).toFixed(2)}`,
          order.fulfillment_method || 'N/A',
          order.order_items?.length || 0
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AdminLayout title="Sales Records" description="View completed sales and revenue">
        <div className="sales-records-container">
          <div className="sales-header">
            <div className="sales-summary">
              {[1, 2, 3].map(i => (
                <div key={i} className="summary-card inventory-skeleton-card">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-value"></div>
                </div>
              ))}
            </div>
          </div>
          <SkeletonLoader type="table" rows={8} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sales Records" description="View completed sales and revenue">
      <div className="sales-records-container">
        {/* Header with Filters */}
        <div className="sales-header">
          <div className="sales-summary">
            <div className="summary-card">
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value">₱{totalRevenue.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Orders</div>
              <div className="summary-value">{salesData.reduce((sum, g) => sum + g.orderCount, 0)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Average Order</div>
              <div className="summary-value">
                ₱{salesData.length > 0 ? (totalRevenue / salesData.reduce((sum, g) => sum + g.orderCount, 0)).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          <div className="sales-controls">
            <div className="filter-group">
              <label>Period:</label>
              <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>

            <button className="export-btn" onClick={exportToCSV}>
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Sales Data by Date */}
        <div className="sales-content">
          {salesData.length === 0 ? (
            <div className="no-sales">
              <p>No completed sales found for this period</p>
            </div>
          ) : (
            salesData.map((group, idx) => (
              <div key={idx} className="sales-group">
                <div className="group-header">
                  <h3>{group.date}</h3>
                  <div className="group-stats">
                    <span className="stat-badge">{group.orderCount} orders</span>
                    <span className="stat-total">₱{group.totalSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="orders-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Time</th>
                        <th>Method</th>
                        <th>Items</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.orders.map(order => (
                        <tr key={order.id}>
                          <td className="order-number">{order.order_number}</td>
                          <td>
                            {new Date(order.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <span className={`method-badge method-${order.fulfillment_method?.toLowerCase()}`}>
                              {order.fulfillment_method || 'N/A'}
                            </span>
                          </td>
                          <td>{order.order_items?.length || 0} items</td>
                          <td className="order-amount">₱{parseFloat(order.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SalesRecords;
