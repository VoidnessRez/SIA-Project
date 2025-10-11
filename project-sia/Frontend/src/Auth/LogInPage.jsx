import { useState } from 'react';
import './Loginpage.css';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', { email, password });
  };

  return (
    <div className="page-container">
      <div className="login-card">
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="username"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />

          <div className="forgot-container">
            <button type="button" className="forgot-btn">
              Forgot password?
            </button>
          </div>

          <div className="button-container">
            <button type="submit" className="login-btn">
              Login
            </button>
          </div>

          <div className="signup-text">
            <span>Don’t have an account? </span>
            <button type="button" className="signup-btn">
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}