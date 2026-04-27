import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminSidebar() {
  const { logout, user, unreadMessageCount } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navClass = ({ isActive }) =>
    `${isActive ? 'active' : ''}`;

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h5>
          <i className="fas fa-layer-group"></i> <span className="sidebar-title-text">Admin Panel</span>
        </h5>
      </div>
      <nav className="sidebar-menu">
        {isAdmin && (
          <NavLink to="/admin" className={navClass} title="Dashboard">
            <i className="fas fa-chart-line"></i> <span className="sidebar-label">Dashboard</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <NavLink to="/admin/products" className={navClass} title="Products">
            <i className="fas fa-box"></i> <span className="sidebar-label">Products</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <NavLink to="/admin/orders" className={navClass} title="Orders">
            <i className="fas fa-receipt"></i> <span className="sidebar-label">Orders</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <NavLink to="/messages" className={navClass} title="Messages">
            <i className="fas fa-comments"></i> <span className="sidebar-label">Messages</span>
            {unreadMessageCount > 0 && <span className="sidebar-badge">{unreadMessageCount}</span>}
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/sales" className={navClass} title="Sales">
            <i className="fas fa-chart-bar"></i> <span className="sidebar-label">Sales</span>
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/customers" className={navClass} title="Customers">
            <i className="fas fa-user"></i> <span className="sidebar-label">Customers</span>
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/staff" className={navClass} title="Staff Members">
            <i className="fas fa-user-tie"></i> <span className="sidebar-label">Staff Members</span>
          </NavLink>
        )}
        {(isAdmin || isStaff) && (
          <NavLink to="/admin/delivery" className={navClass} title="Delivery">
            <i className="fas fa-truck"></i> <span className="sidebar-label">Delivery</span>
          </NavLink>
        )}
        <NavLink to="/admin/profile" className={navClass} title="Profile">
          <i className="fas fa-user-circle"></i> <span className="sidebar-label">Profile</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin/users" className={navClass} title="Users">
            <i className="fas fa-users"></i> <span className="sidebar-label">Users</span>
          </NavLink>
        )}
        <hr className="sidebar-divider" />
        {isAdmin && (
          <NavLink to="/admin/settings" className={navClass} title="Settings">
            <i className="fas fa-cog"></i> <span className="sidebar-label">Settings</span>
          </NavLink>
        )}
        <button className="btn btn-link text-white text-start" onClick={handleLogout} style={{ textDecoration: 'none' }} title="Logout">
          <i className="fas fa-sign-out-alt"></i> <span className="sidebar-label">Logout</span>
        </button>
      </nav>
    </div>
  );
}
