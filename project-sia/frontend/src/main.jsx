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
import UserPersonalInfo from './components/UserProfile/UserPersonalInfo.jsx';
import InventoryPage from './admin/admComponents/inventory/InventoryPage.jsx';
import SpareParts from './admin/admComponents/inventory/spareParts/SpareParts.jsx';
import Accessories from './admin/admComponents/inventory/accessories/Accessories.jsx';
import LowStockAlerts from './admin/admComponents/inventory/stockAlerts/LowStockAlerts.jsx';
import BrandsManagement from './admin/admComponents/inventory/brandsManagement/BrandsManagement.jsx';
import ItemPickup from './admin/admComponents/inventory/itemPickup/ItemPickup.jsx';
import ReturnedItems from './admin/admComponents/inventory/returnedItems/ReturnedItems.jsx';
import RestockManagement from './admin/admComponents/inventory/restockManagement/RestockManagement.jsx';
import './index.css';
import './darkMode.css';

console.log('📦 [main.jsx] Module loaded! UserPersonalInfo imported:', UserPersonalInfo);

const App = () => {
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <AuthProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <AppContent 
            showAdminModal={showAdminModal}
            setShowAdminModal={setShowAdminModal}
          />
        </BrowserRouter>
      </DarkModeProvider>
    </AuthProvider>
  );
};

const AppContent = ({ showAdminModal, setShowAdminModal }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl + Shift + A
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdminModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowAdminModal]);

  return (
    <>
      {/* Only show Header and FloatingCart on non-admin routes */}
      {!isAdminRoute && <Header />}
      
      <Routes>
            {/* Public routes - all pages visible */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Protected route - only Orders needs login */}
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } 
            />
            
            {/* User Personal Info - NO PROTECTION FOR TESTING */}
            <Route 
              path="/personal-info" 
              element={(() => {
                console.log('🎯🎯🎯 [main.jsx] /personal-info ROUTE MATCHED! Rendering UserPersonalInfo...');
                return <UserPersonalInfo />;
              })()}
            />
            
            {/* Admin Inventory Page */}
            <Route path="/admin/inventory" element={<InventoryPage />} />
            <Route path="/admin/spare-parts" element={<SpareParts />} />
            <Route path="/admin/accessories" element={<Accessories />} />
            <Route path="/admin/low-stock" element={<LowStockAlerts />} />
            <Route path="/admin/brands" element={<BrandsManagement />} />
            <Route path="/admin/pickup" element={<ItemPickup />} />
            <Route path="/admin/returnModule" element={<ReturnedItems />} />
            <Route path="/admin/delivers" element={<RestockManagement />} />
          </Routes>
          
          {/* Only show FloatingCart on non-admin routes */}
          {!isAdminRoute && <FloatingCart itemCount={0} />}
          
          <AdminAuthModal 
            isOpen={showAdminModal} 
            onClose={() => setShowAdminModal(false)} 
          />
        </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);