import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "./Loginpage.css";
import App from './LoginPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);