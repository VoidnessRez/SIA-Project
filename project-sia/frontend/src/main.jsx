import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from '../router/pRoutes/ProtectedRoute.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import Products from './pages/products/Products.jsx';
import Brands from './pages/brand/Brands.jsx';
import Orders from './pages/orders/Orders.jsx';
import Contact from './pages/contacts/Contact.jsx';
import LoginPage from './Auth/login/LogInPage.jsx';
import SignUpPage from './Auth/signup/SignUpPage.jsx';
import Header from './components/header/Header.jsx';
import FloatingCart from './components/cart/FloatingCart.jsx';
import AdminAuthModal from './AdminAuth/AdminAuthModal.jsx';
import InventoryPage from './admin/inventory/InventoryPage.jsx';
import './index.css';
import './darkMode.css';

const App = () => {
  // Use useLocation inside a child component of BrowserRouter
  const Layout = ({ children }) => {
    const location = useLocation();
    const isInventory = location.pathname === '/inventory';
    return (
      <>
        {!isInventory && <Header />}
        {children}
        {!isInventory && <FloatingCart itemCount={0} />}
      </>
    );
  };
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl + Shift + A
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdminModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AuthProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public routes - all pages visible */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/products" element={<Products />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/contact" element={<Contact />} />
              {/* Admin Inventory route - no header/cart */}
              <Route path="/inventory" element={<InventoryPage />} />
              {/* Protected route - only Orders needs login */}
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
            </Routes>
            <AdminAuthModal 
              isOpen={showAdminModal} 
              onClose={() => setShowAdminModal(false)} 
            />
          </Layout>
        </BrowserRouter>
      </DarkModeProvider>
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);