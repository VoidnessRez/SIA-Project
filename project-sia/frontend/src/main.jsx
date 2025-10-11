import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from "./Auth/LogInPage.jsx";
import "./Auth/Loginpage.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);