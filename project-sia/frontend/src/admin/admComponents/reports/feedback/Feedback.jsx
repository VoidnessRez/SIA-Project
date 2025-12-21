import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './Feedback.css';

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, bug, feature, suggestion, complaint, praise
  const [statusFilter, setStatusFilter] = useState('all'); // all, read, unread

  // Fetch feedback
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
      setFilteredFeedbacks(data || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      // alert('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (feedbackId) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_read: true })
        .eq('id', feedbackId);

      if (error) throw error;

      fetchFeedbacks();
    } catch (error) {
      console.error('Error marking as read:', error);
      // alert('Failed to mark as read');
    }
  };

  // Delete feedback
  const handleDeleteFeedback = async (feedbackId) => {
    if (!confirm('Delete this feedback? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      // alert('Feedback deleted');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      // alert('Failed to delete feedback');
    }
  };

  // Filter feedbacks
  useEffect(() => {
    let filtered = feedbacks;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(fb => {
        const name = fb.profiles?.full_name?.toLowerCase() || '';
        const email = fb.profiles?.email?.toLowerCase() || '';
        const message = fb.message?.toLowerCase() || '';
        const subject = fb.subject?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower) || message.includes(searchLower) || subject.includes(searchLower);
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(fb => fb.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isRead = statusFilter === 'read';
      filtered = filtered.filter(fb => fb.is_read === isRead);
    }

    setFilteredFeedbacks(filtered);
  }, [searchTerm, typeFilter, statusFilter, feedbacks]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Calculate stats
  const totalFeedbacks = feedbacks.length;
  const unreadFeedbacks = feedbacks.filter(f => !f.is_read).length;
  const readFeedbacks = feedbacks.filter(f => f.is_read).length;
  const filteredCount = filteredFeedbacks.length;

  return (
    <AdminLayout>
      <div className="feedback-container">
        <h1>Customer Feedback</h1>

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="feedback-summary">
            <div className="summary-card">
              <div className="summary-label">Total Feedback</div>
              <div className="summary-value">{totalFeedbacks}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Unread</div>
              <div className="summary-value warning">{unreadFeedbacks}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Read</div>
              <div className="summary-value success">{readFeedbacks}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="feedback-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, email, subject, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>Type:</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="complaint">Complaint</option>
                  <option value="praise">Praise</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Feedback List */}
        <div className="feedback-list">
          {loading ? (
            <SkeletonLoader />
          ) : filteredFeedbacks.length === 0 ? (
            <div className="no-feedback">
              <p>No feedback found</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className={`feedback-item ${!feedback.is_read ? 'unread' : ''}`}>
                <div className="feedback-header">
                  <div className="feedback-user">
                    <div className="user-avatar">{feedback.profiles?.full_name?.[0] || 'U'}</div>
                    <div className="user-details">
                      <h3>{feedback.profiles?.full_name || 'Anonymous'}</h3>
                      <p>{feedback.profiles?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="feedback-meta">
                    <span className={`type-badge ${feedback.type}`}>{feedback.type || 'general'}</span>
                    <span className="feedback-date">{new Date(feedback.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="feedback-content">
                  <h4>{feedback.subject || 'No subject'}</h4>
                  <p>{feedback.message || 'No message'}</p>
                </div>

                <div className="feedback-actions">
                  {!feedback.is_read && (
                    <button
                      className="action-btn read-btn"
                      onClick={() => handleMarkAsRead(feedback.id)}
                    >
                      ✓ Mark as Read
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteFeedback(feedback.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="feedback-footer">
            <p>Showing {filteredCount} of {totalFeedbacks} feedbacks</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Feedback;
