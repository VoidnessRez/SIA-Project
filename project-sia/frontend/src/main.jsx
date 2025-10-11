import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "./Auth/Loginpage.css";
import App from './Auth/LogInPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);