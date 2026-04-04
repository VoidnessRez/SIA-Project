import { useEffect, useState } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './Analytics.css';

const BACKEND_URL = 'http://localhost:5174';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalReviews: 0,
    avgRating: 0,
    pendingReturns: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [ordersRes, productsRes, reviewsRes, returnsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/orders`).then((r) => r.json()).catch(() => null),
          fetch(`${BACKEND_URL}/api/inventory/products`).then((r) => r.json()).catch(() => null),
          supabase.from('reviews').select('rating'),
          supabase.from('return_requests').select('status'),
        ]);

        const orders = Array.isArray(ordersRes)
          ? ordersRes
          : (ordersRes?.data || []);

        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        const products = productsRes?.success ? (productsRes.data || []) : [];

        const reviews = reviewsRes?.data || [];
        const avgRating = reviews.length
          ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
          : 0;

        const returns = returnsRes?.data || [];
        const pendingReturns = returns.filter((r) => r.status === 'pending').length;

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalProducts: products.length,
          totalReviews: reviews.length,
          avgRating,
          pendingReturns,
        });
      } catch {
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          totalReviews: 0,
          avgRating: 0,
          pendingReturns: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <AdminLayout title="Analytics" description="Live overview of business performance">
      <div className="analytics-page">
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="label">Total Orders</div>
              <div className="value">{stats.totalOrders}</div>
            </div>
            <div className="analytics-card">
              <div className="label">Total Revenue</div>
              <div className="value">₱{stats.totalRevenue.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="analytics-card">
              <div className="label">Total Products</div>
              <div className="value">{stats.totalProducts}</div>
            </div>
            <div className="analytics-card">
              <div className="label">Total Reviews</div>
              <div className="value">{stats.totalReviews}</div>
            </div>
            <div className="analytics-card">
              <div className="label">Average Rating</div>
              <div className="value">{stats.avgRating.toFixed(1)} ★</div>
            </div>
            <div className="analytics-card">
              <div className="label">Pending Returns</div>
              <div className="value">{stats.pendingReturns}</div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Analytics;
