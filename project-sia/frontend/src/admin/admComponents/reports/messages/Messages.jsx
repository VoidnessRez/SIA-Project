import { useState, useEffect } from 'react';
import AdminLayout from '../../../../AdminAuth/layout/AdminLayout';
import supabase from '../../../../lib/supabaseClient';
import SkeletonLoader from '../../inventory/SkeletonLoader';
import './Messages.css';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, read, unread
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages(data || []);
      setFilteredMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // alert('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const handleMarkAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
      // alert('Failed to mark as read');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // alert('Message deleted');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      // alert('Failed to delete message');
    }
  };

  // Open message
  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      handleMarkAsRead(message.id);
    }
  };

  // Filter messages
  useEffect(() => {
    let filtered = messages;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => {
        const name = msg.profiles?.full_name?.toLowerCase() || '';
        const email = msg.profiles?.email?.toLowerCase() || '';
        const subject = msg.subject?.toLowerCase() || '';
        const content = msg.message?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower) || subject.includes(searchLower) || content.includes(searchLower);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isRead = statusFilter === 'read';
      filtered = filtered.filter(msg => msg.is_read === isRead);
    }

    setFilteredMessages(filtered);
  }, [searchTerm, statusFilter, messages]);

  useEffect(() => {
    fetchMessages();
  }, []);

  // Calculate stats
  const totalMessages = messages.length;
  const unreadMessages = messages.filter(m => !m.is_read).length;
  const readMessages = messages.filter(m => m.is_read).length;
  const filteredCount = filteredMessages.length;

  return (
    <AdminLayout>
      <div className="messages-container">
        <h1>Messages</h1>

        {/* Summary Cards */}
        {loading ? (
          <SkeletonLoader type="stats" />
        ) : (
          <div className="messages-summary">
            <div className="summary-card">
              <div className="summary-label">Total Messages</div>
              <div className="summary-value">{totalMessages}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Unread</div>
              <div className="summary-value warning">{unreadMessages}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Read</div>
              <div className="summary-value success">{readMessages}</div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {!loading && (
          <div className="messages-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
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

        {/* Messages Layout */}
        <div className="messages-layout">
          {/* Messages List */}
          <div className="messages-list">
            {loading ? (
              <SkeletonLoader />
            ) : filteredMessages.length === 0 ? (
              <div className="no-messages">
                <p>No messages found</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${!message.is_read ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                  onClick={() => handleOpenMessage(message)}
                >
                  <div className="message-avatar">{message.profiles?.full_name?.[0] || 'U'}</div>
                  <div className="message-preview">
                    <div className="message-header">
                      <h4>{message.profiles?.full_name || 'Anonymous'}</h4>
                      <span className="message-date">{new Date(message.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="message-subject">{message.subject || 'No subject'}</div>
                    <div className="message-snippet">{message.message?.substring(0, 80)}...</div>
                  </div>
                  {!message.is_read && <div className="unread-indicator"></div>}
                </div>
              ))
            )}
          </div>

          {/* Message Detail */}
          <div className="message-detail">
            {selectedMessage ? (
              <>
                <div className="detail-header">
                  <div className="detail-user">
                    <div className="detail-avatar">{selectedMessage.profiles?.full_name?.[0] || 'U'}</div>
                    <div className="detail-user-info">
                      <h3>{selectedMessage.profiles?.full_name || 'Anonymous'}</h3>
                      <p>{selectedMessage.profiles?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="detail-meta">
                    <span className="detail-date">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-subject">
                  <h2>{selectedMessage.subject || 'No subject'}</h2>
                </div>

                <div className="detail-content">
                  <p>{selectedMessage.message || 'No message content'}</p>
                </div>

                <div className="detail-actions">
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>📩</p>
                <h3>No message selected</h3>
                <p>Select a message from the list to view its content</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="messages-footer">
            <p>Showing {filteredCount} of {totalMessages} messages</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default Messages;
