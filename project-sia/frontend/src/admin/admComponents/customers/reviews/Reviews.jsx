import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './Reviews.css';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [statusFilter, setStatusFilter] = useState('all'); // all, approved, pending

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews with product and user info
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products:product_id(name, image_url),
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      setFilteredReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // alert('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Approve review
  const handleApproveReview = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      // alert('Review approved successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      // alert('Failed to approve review');
    }
  };

  // Reject/Unapprove review
  const handleRejectReview = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;

      // alert('Review rejected successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      // alert('Failed to reject review');
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // alert('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      // alert('Failed to delete review');
    }
  };

  // Filter reviews
  useEffect(() => {
    let filtered = reviews;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(review => {
        const productName = review.products?.name?.toLowerCase() || '';
        const userName = review.profiles?.full_name?.toLowerCase() || '';
        const comment = review.comment?.toLowerCase() || '';
        return productName.includes(searchLower) || userName.includes(searchLower) || comment.includes(searchLower);
      });
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isApproved = statusFilter === 'approved';
      filtered = filtered.filter(review => review.is_approved === isApproved);
    }

    setFilteredReviews(filtered);
  }, [searchTerm, ratingFilter, statusFilter, reviews]);

  // Fetch reviews on mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Calculate stats
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter(r => !r.is_approved).length;
  const approvedReviews = reviews.filter(r => r.is_approved).length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const filteredCount = filteredReviews.length;

  // Render star rating
  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <AdminLayout>
      <div className="reviews-container">
        <h1>Reviews & Ratings</h1>

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="reviews-summary">
            <div className="summary-card">
              <div className="summary-label">Total Reviews</div>
              <div className="summary-value">{totalReviews}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Pending</div>
              <div className="summary-value">{pendingReviews}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Approved</div>
              <div className="summary-value">{approvedReviews}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Avg Rating</div>
              <div className="summary-value">{avgRating} ⭐</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="reviews-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by product, user, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Rating:</label>
                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="reviews-table-container">
          {loading ? (
            <SkeletonLoader />
          ) : filteredReviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews found</p>
            </div>
          ) : (
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <div className="product-info">
                        {review.products?.image_url && (
                          <img
                            src={review.products.image_url}
                            alt={review.products.name}
                            className="product-thumb"
                          />
                        )}
                        <span className="product-name">{review.products?.name || 'Unknown Product'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{review.profiles?.full_name || 'Anonymous'}</div>
                        <div className="customer-email">{review.profiles?.email || ''}</div>
                      </div>
                    </td>
                    <td>
                      <div className="rating-display">
                        <span className="stars">{renderStars(review.rating)}</span>
                        <span className="rating-num">({review.rating}/5)</span>
                      </div>
                    </td>
                    <td>
                      <div className="comment-text">{review.comment || 'No comment'}</div>
                    </td>
                    <td>{new Date(review.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${review.is_approved ? 'approved' : 'pending'}`}>
                        {review.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        {!review.is_approved ? (
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleApproveReview(review.id)}
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleRejectReview(review.id)}
                          >
                            Unapprove
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="reviews-footer">
            <p>Showing {filteredCount} of {totalReviews} reviews</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Reviews;
