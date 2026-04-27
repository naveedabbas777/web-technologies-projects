import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import MyOrders from './pages/MyOrders.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import Messages from './pages/Messages.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminProducts from './admin/AdminProducts.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminSales from './admin/AdminSales.jsx';
import AdminCustomers from './admin/AdminCustomers.jsx';
import AdminStaff from './admin/AdminStaff.jsx';
import AdminDelivery from './admin/AdminDelivery.jsx';
import AdminProfile from './admin/AdminProfile.jsx';
import AdminSettings from './admin/AdminSettings.jsx';
import RiderDashboard from './rider/RiderDashboard.jsx';
import RiderOrders from './rider/RiderOrders.jsx';
import RiderProfile from './rider/RiderProfile.jsx';
import RiderHistory from './rider/RiderHistory.jsx';
import AdminUsers from './admin/AdminUsers.jsx';
import StaffDashboard from './staff/StaffDashboard.jsx';
import StaffProducts from './staff/StaffProducts.jsx';
import StaffOrders from './staff/StaffOrders.jsx';
import StaffSales from './staff/StaffSales.jsx';
import StaffCustomers from './staff/StaffCustomers.jsx';
import StaffDelivery from './staff/StaffDelivery.jsx';
import StaffProfile from './staff/StaffProfile.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

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
  if (user.role === 'rider') return '/rider';
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
  if (!user || user.role !== 'rider') {
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
    </>
  );
}
