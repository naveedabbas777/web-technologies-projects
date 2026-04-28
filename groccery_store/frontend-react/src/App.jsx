import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { LoadingState } from './components/ui/UIStates.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const MyOrders = lazy(() => import('./pages/MyOrders.jsx'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'));
const AdminProducts = lazy(() => import('./admin/AdminProducts.jsx'));
const AdminOrders = lazy(() => import('./admin/AdminOrders.jsx'));
const AdminSales = lazy(() => import('./admin/AdminSales.jsx'));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers.jsx'));
const AdminStaff = lazy(() => import('./admin/AdminStaff.jsx'));
const AdminDelivery = lazy(() => import('./admin/AdminDelivery.jsx'));
const AdminProfile = lazy(() => import('./admin/AdminProfile.jsx'));
const AdminSettings = lazy(() => import('./admin/AdminSettings.jsx'));
const RiderDashboard = lazy(() => import('./rider/RiderDashboard.jsx'));
const RiderOrders = lazy(() => import('./rider/RiderOrders.jsx'));
const RiderProfile = lazy(() => import('./rider/RiderProfile.jsx'));
const RiderHistory = lazy(() => import('./rider/RiderHistory.jsx'));
const AdminUsers = lazy(() => import('./admin/AdminUsers.jsx'));
const StaffDashboard = lazy(() => import('./staff/StaffDashboard.jsx'));
const StaffProducts = lazy(() => import('./staff/StaffProducts.jsx'));
const StaffOrders = lazy(() => import('./staff/StaffOrders.jsx'));
const StaffSales = lazy(() => import('./staff/StaffSales.jsx'));
const StaffCustomers = lazy(() => import('./staff/StaffCustomers.jsx'));
const StaffDelivery = lazy(() => import('./staff/StaffDelivery.jsx'));
const StaffProfile = lazy(() => import('./staff/StaffProfile.jsx'));

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function getRoleRedirect(user) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'staff') return '/staff';
  if (user.role === 'rider' || user.role === 'delivery_rider') return '/rider';
  return '/';
}

function CustomerRoute({ children, allowGuests = false }) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return allowGuests ? children : <Navigate to="/login" replace />;
  }

  if (user?.role !== 'customer') {
    return <Navigate to={getRoleRedirect(user)} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RiderRoute({ children }) {
  const { user } = useAuth();
  if (!user || (user.role !== 'rider' && user.role !== 'delivery_rider')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== 'staff') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const {
    user,
    isLoggedIn,
    latestMessage,
    clearLatestMessage,
    notificationPermission,
    requestNotificationPermission,
    globalAlert,
    dismissAlert
  } = useAuth();
  const navigate = useNavigate();
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);

  const notificationPromptKey = useMemo(() => {
    if (!user?.id) return 'push-notification-prompt-dismissed';
    return `push-notification-prompt-dismissed-${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    const dismissed = localStorage.getItem(notificationPromptKey) === 'true';
    setNotificationPromptDismissed(dismissed);
  }, [notificationPromptKey]);

  const dismissNotificationPrompt = () => {
    localStorage.setItem(notificationPromptKey, 'true');
    setNotificationPromptDismissed(true);
  };

  const enableBrowserNotifications = async () => {
    try {
      await requestNotificationPermission();
    } finally {
      dismissNotificationPrompt();
    }
  };

  const shouldShowNotificationPrompt = isLoggedIn
    && !!user
    && notificationPermission === 'default'
    && !notificationPromptDismissed;

  return (
    <>
      {shouldShowNotificationPrompt && (
        <div className="notification-consent-banner">
          <div className="notification-consent-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="notification-consent-content">
            <strong>Enable browser notifications</strong>
            <p className="mb-0">Get instant alerts when admin or staff send a new message.</p>
          </div>
          <div className="notification-consent-actions">
            <button
              type="button"
              className="btn btn-sm btn-warning"
              onClick={enableBrowserNotifications}
            >
              Enable
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={dismissNotificationPrompt}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {globalAlert && (
        <div
          className={`alert alert-${globalAlert.type === 'error' ? 'danger' : globalAlert.type === 'success' ? 'success' : 'info'} alert-dismissible fade show`}
          role="alert"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1085,
            minWidth: '320px',
            maxWidth: '92vw',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.22)'
          }}
        >
          {globalAlert.title && <strong className="me-2">{globalAlert.title}</strong>}
          {globalAlert.message}
          <button type="button" className="btn-close" aria-label="Close" onClick={dismissAlert}></button>
        </div>
      )}

      {latestMessage && (
        <div className="message-toast">
          <div className="message-toast-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="message-toast-body">
            <strong>{latestMessage.subject || 'New message'}</strong>
            <p className="mb-0">{latestMessage.body || 'You received a new notification.'}</p>
          </div>
          <div className="message-toast-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => {
                clearLatestMessage();
                navigate('/messages');
              }}
            >
              Open
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={clearLatestMessage}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Suspense fallback={<LoadingState title="Loading page" description="Preparing your dashboard..." />}>
      <Routes>
        <Route
          path="/"
          element={
            <CustomerRoute allowGuests>
              <Home />
            </CustomerRoute>
          }
        />
        <Route
          path="/products"
          element={
            <CustomerRoute allowGuests>
              <Products />
            </CustomerRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <CustomerRoute>
              <Cart />
            </CustomerRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <CustomerRoute>
              <Checkout />
            </CustomerRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <CustomerRoute>
              <Profile />
            </CustomerRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <CustomerRoute>
              <MyOrders />
            </CustomerRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <CustomerRoute>
              <CustomerDashboard />
            </CustomerRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sales"
          element={
            <AdminRoute>
              <AdminSales />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminCustomers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminRoute>
              <AdminStaff />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/delivery"
          element={
            <AdminRoute>
              <AdminDelivery />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/rider"
          element={
            <RiderRoute>
              <RiderDashboard />
            </RiderRoute>
          }
        />
        <Route
          path="/rider/orders"
          element={
            <RiderRoute>
              <RiderOrders />
            </RiderRoute>
          }
        />
        <Route
          path="/rider/profile"
          element={
            <RiderRoute>
              <RiderProfile />
            </RiderRoute>
          }
        />
        <Route
          path="/rider/history"
          element={
            <RiderRoute>
              <RiderHistory />
            </RiderRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffDashboard />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/products"
          element={
            <StaffRoute>
              <StaffProducts />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/orders"
          element={
            <StaffRoute>
              <StaffOrders />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/sales"
          element={
            <StaffRoute>
              <StaffSales />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/customers"
          element={
            <StaffRoute>
              <StaffCustomers />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/delivery"
          element={
            <StaffRoute>
              <StaffDelivery />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <StaffRoute>
              <StaffProfile />
            </StaffRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
