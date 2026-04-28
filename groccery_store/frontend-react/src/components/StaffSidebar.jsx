import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffSidebar() {
  const { logout, unreadMessageCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navClass = ({ isActive }) => `${isActive ? 'active' : ''}`;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h5>
          <i className="fas fa-clipboard-list"></i> <span className="sidebar-title-text">Staff Panel</span>
        </h5>
      </div>
      <nav className="sidebar-menu">
        <NavLink to="/staff" className={navClass} title="Dashboard">
          <i className="fas fa-columns"></i> <span className="sidebar-label">Dashboard</span>
        </NavLink>
        <NavLink to="/staff/products" className={navClass} title="Products">
          <i className="fas fa-box"></i> <span className="sidebar-label">Products</span>
        </NavLink>
        <NavLink to="/staff/orders" className={navClass} title="Orders">
          <i className="fas fa-receipt"></i> <span className="sidebar-label">Orders</span>
        </NavLink>
        <NavLink to="/messages" className={navClass} title="Messages">
          <i className="fas fa-comments"></i> <span className="sidebar-label">Messages</span>
          {unreadMessageCount > 0 && <span className="sidebar-badge">{unreadMessageCount}</span>}
        </NavLink>
        <NavLink to="/staff/sales" className={navClass} title="Sales">
          <i className="fas fa-chart-bar"></i> <span className="sidebar-label">Sales</span>
        </NavLink>
        <NavLink to="/staff/customers" className={navClass} title="Customers">
          <i className="fas fa-users"></i> <span className="sidebar-label">Customers</span>
        </NavLink>
        <NavLink to="/staff/delivery" className={navClass} title="Delivery">
          <i className="fas fa-truck"></i> <span className="sidebar-label">Delivery</span>
        </NavLink>
        <NavLink to="/staff/profile" className={navClass} title="Profile">
          <i className="fas fa-user-circle"></i> <span className="sidebar-label">Profile</span>
        </NavLink>
        <button className="btn btn-link text-white text-start" onClick={handleLogout} style={{ textDecoration: 'none' }} title="Logout">
          <i className="fas fa-sign-out-alt"></i> <span className="sidebar-label">Logout</span>
        </button>
      </nav>
    </div>
  );
}
