import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Loginpage.css';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[LoginPage] 🔐 Login attempt with identifier:', identifier);

    // Basic validation
    if (!identifier || !password) {
      console.log('[LoginPage] ❌ Validation failed - missing fields');
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    console.log('[LoginPage] ✅ Validation passed');

    try {
      console.log('[LoginPage] 📡 Calling login from AuthContext...');
      const result = await login(identifier, password);
      console.log('[LoginPage] 📨 Login result:', result);
      
      if (result.success) {
        console.log('[LoginPage] ✅ Login successful, navigating...');
        // Redirect to the page they were trying to access, or home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        console.log('[LoginPage] ❌ Login failed:', result.error);
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('[LoginPage] 💥 Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      console.log('[LoginPage] 🏁 Login process completed');
    }
  };

  return (
    <div className="page-container">
      <div className="login-card">
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="input-field"
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            disabled={loading}
          />

          <div className="forgot-container">
            <button type="button" className="forgot-btn">
              Forgot password?
            </button>
          </div>

          <div className="button-container">
            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className="signup-text">
            <span>Don’t have an account? </span>
            <button type="button" className="signup-btn" onClick={() => navigate('/signup')}>
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}