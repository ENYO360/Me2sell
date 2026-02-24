import './index.css';
import GlobalLoader from './pages/GlobalLoader';
import { useLoading } from './context/LoadingContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Home from './pages/Home';
import { Router, Route, Routes} from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Overview from './pages/dashboard/Overview';
import Products from './pages/dashboard/Products';
import Cart from './pages/dashboard/Cart';
import SalesHistory from './pages/dashboard/SalesHistory';
import Departments from './pages/dashboard/Departments';
import DashboardHome from './pages/dashboard/O_DashboardHome';
import Categories from './pages/dashboard/Categories';
import Profile from './pages/dashboard/Profile';
import Notifications from './pages/dashboard/Notifications';
import ConfirmationModal from './pages/dashboard/ConfirmationModal';
import StaffPage from './pages/dashboard/StaffPage';
import HowItWorks from './pages/HowItWorks';
import Support from './pages/Support';
import EnyotronicsPage from './pages/EnyotronicsPage';
import ProfileSetup from './pages/SetupProfile';
import ForgotPassword from './pages/ForgotPassword';
import NetworkBanner from './pages/dashboard/NetworkBanner';
import BuyerMarketplace from './pages/marketplace/MarketplaceHome';
import SellerProfile from './pages/marketplace/SellerProfile';

function App() {
  const { loading } = useLoading();

  return (
    <>
      <NetworkBanner />
      <GlobalLoader show={loading} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
            } 
          />
          <Route path="/dashboard/overview" element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
            } 
          />
          <Route path="/dashboard/cart" element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/sales-history" element={
            <ProtectedRoute>
              <SalesHistory />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/departments" element={
            <ProtectedRoute>
              <Departments />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/categories" element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
            } />
          <Route path="/dashboard/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
            } />
          <Route path="/how-it-works" element={<HowItWorks/>} />
          <Route path="/dashboard/staff" element={
            <ProtectedRoute>
              <StaffPage />
            </ProtectedRoute>
            } />
          <Route path="/support" element={<Support />} />
          <Route path="/enyotronics" element={<EnyotronicsPage />} />
          <Route path="/setup-profile" element={<ProfileSetup />} />
          <Route path="/marketplace" element={<BuyerMarketplace />} />
          <Route path="/seller/:sellerId" element={<SellerProfile />} />
        </Routes>
        <ConfirmationModal />
    </>
  );
}

export default App;
