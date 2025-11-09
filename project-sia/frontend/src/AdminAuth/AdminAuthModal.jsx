
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import './AdminAuthModal.css';

const AdminAuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // reset state when modal closes
      setShowForm(false);
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      // Allow Enter to submit when form visible
      if (e.key === 'Enter' && showForm && !loading) {
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, showForm, username, password, loading]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.className === 'admin-auth-overlay') {
      onClose();
    }
  };

  const validate = () => {
    setError('');
    const user = String(username || '').trim();
    const pass = String(password || '');
    if (!user) return setError('Username is required');
    if (!/^\w{3,30}$/.test(user)) return setError('Username must be 3-30 characters and contain only letters, numbers, or underscores');
    if (!pass) return setError('Password is required');
    if (pass.length < 6) return setError('Password must be at least 6 characters');
    return null;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const v = validate();
    if (v) return; // validate() sets error
    setLoading(true);
    setError('');

    try {
      // Query the adminauth table for matching username and password
      const { data, error: supaError } = await supabase
        .from('adminauth')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .single();

      if (supaError || !data) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      // Optionally, store a flag in sessionStorage
      try { sessionStorage.setItem('adminAuthed', 'true'); } catch (err) { /* ignore */ }

      setLoading(false);
      onClose();
      navigate('/inventory');
    } catch (err) {
      setError('Network error — please try again');
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-overlay" onClick={handleOverlayClick}>
      <div className="admin-auth-modal" role="dialog" aria-modal="true" aria-label="Admin authentication">
        <button className="admin-auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="admin-auth-content">
          <div className="admin-auth-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>

          <h2>Hello Admin!</h2>
          <p>Please login to access Security panel</p>

          {!showForm ? (
            <div className="admin-auth-actions">
              <button
                className="admin-auth-btn admin-auth-login"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                Continue
              </button>
              <button className="admin-auth-btn admin-auth-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          ) : (
            <form className="admin-auth-form" onSubmit={handleSubmit}>
              <label htmlFor="admin-username">Username</label>
              <input
                id="admin-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
              />

              <label htmlFor="admin-password">Password</label>
              <div className="admin-auth-password-wrap">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="admin-auth-showpass"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {error && <div className="admin-auth-error" role="alert">{error}</div>}

              <div className="admin-auth-actions admin-auth-actions-form">
                <button className="admin-auth-btn admin-auth-login" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <button className="admin-auth-btn admin-auth-cancel" type="button" onClick={() => setShowForm(false)} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
