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
import Checkout from './pages/checkout/Checkout.jsx';
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
import OverstockAlerts from './admin/admComponents/inventory/stockAlerts/OverstockAlerts.jsx';
import BrandsManagement from './admin/admComponents/inventory/brandsManagement/BrandsManagement.jsx';
import ItemPickup from './admin/admComponents/inventory/itemPickup/ItemPickup.jsx';
import ReturnedItems from './admin/admComponents/inventory/returnedItems/ReturnedItems.jsx';
import RestockManagement from './admin/admComponents/inventory/restockManagement/RestockManagement.jsx';
import PriceHistory from './admin/admComponents/priceHistory/PriceHistory.jsx';
import StockRelease from './admin/admComponents/inventory/stockRelease/StockRelease.jsx';
import InventoryTransactions from './admin/admComponents/inventory/inventoryTransactions/InventoryTransactions.jsx';
import CustomerOrders from './admin/admComponents/ordersAndSales/customerOrders/CustomerOrders.jsx';
import SalesRecords from './admin/admComponents/ordersAndSales/salesRecords/SalesRecords.jsx';
import Transactions from './admin/admComponents/ordersAndSales/transactions/Transactions.jsx';
import UnverifiedUsers from './admin/admComponents/customers/customerList/UnverifiedUsers.jsx';
import VerifiedUsers from './admin/admComponents/customers/customerList/VerifiedUsers.jsx';
import Reviews from './admin/admComponents/customers/reviews/Reviews.jsx';
import SalesReports from './admin/admComponents/reports/salesReports/SalesReports.jsx';
import InventoryReports from './admin/admComponents/reports/inventoryReports/InventoryReports.jsx';
import ReturnManagement from './admin/admComponents/reports/returnManagement/ReturnManagement.jsx';
import Feedback from './admin/admComponents/reports/feedback/Feedback.jsx';
import Messages from './admin/admComponents/reports/messages/Messages.jsx';
import SystemSettings from './admin/admComponents/settings/systemSettings/SystemSettings.jsx';
import AdminUsers from './admin/admComponents/settings/adminUsers/AdminUsers.jsx';
import UserOverview from './admin/admComponents/settings/userOverview/UserOverview.jsx';
import PageNotFound from './pages/notfound/PageNotFound.jsx';
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
            
            {/* Protected routes - require login */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } 
            />
            
            {/* Checkout Page - Protected */}
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            
            {/* Page Not Found - Shopee Payment */}
            <Route path="/page-not-found" element={<PageNotFound />} />
            
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
            <Route path="/admin/overstock" element={<OverstockAlerts />} />
            <Route path="/admin/brands" element={<BrandsManagement />} />
            <Route path="/admin/pickup" element={<ItemPickup />} />
            <Route path="/admin/returnModule" element={<ReturnedItems />} />
            <Route path="/admin/delivers" element={<RestockManagement />} />
            <Route path="/admin/priceHistory" element={<PriceHistory />} />
            <Route path="/admin/stock-release" element={<StockRelease />} />
            <Route path="/admin/inventory-transactions" element={<InventoryTransactions />} />
            
            {/* Admin Orders & Sales */}
            <Route path="/admin/orders" element={<CustomerOrders />} />
            <Route path="/admin/sales" element={<SalesRecords />} />
            <Route path="/admin/transactions" element={<Transactions />} />

            {/* Admin Users & Reviews */}
            <Route path="/admin/unv_users" element={<UnverifiedUsers />} />
            <Route path="/admin/ver_users" element={<VerifiedUsers />} />
            <Route path="/admin/reviews" element={<Reviews />} />

            {/* Admin Reports */}
            <Route path="/admin/reports/sales" element={<SalesReports />} />
            <Route path="/admin/reports/inventory" element={<InventoryReports />} />
            <Route path="/admin/modules" element={<ReturnManagement />} />
            <Route path="/admin/feedbacks" element={<Feedback />} />
            <Route path="/admin/messages" element={<Messages />} />

            {/* Admin Settings */}
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/adminUsers" element={<AdminUsers />} />
            <Route path="/admin/customer" element={<UserOverview />} />
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