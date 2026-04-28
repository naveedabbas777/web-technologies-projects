import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RiderSidebar() {
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
          <i className="fas fa-motorcycle"></i> <span className="sidebar-title-text">Rider Panel</span>
        </h5>
      </div>
      <nav className="sidebar-menu">
        <NavLink to="/rider" className={navClass} title="Dashboard">
          <i className="fas fa-route"></i> <span className="sidebar-label">Dashboard</span>
        </NavLink>
        <NavLink to="/rider/orders" className={navClass} title="Orders">
          <i className="fas fa-clipboard-check"></i> <span className="sidebar-label">Orders</span>
        </NavLink>
        <NavLink to="/messages" className={navClass} title="Messages">
          <i className="fas fa-comments"></i> <span className="sidebar-label">Messages</span>
          {unreadMessageCount > 0 && <span className="sidebar-badge">{unreadMessageCount}</span>}
        </NavLink>
        <NavLink to="/rider/history" className={navClass} title="History">
          <i className="fas fa-history"></i> <span className="sidebar-label">History</span>
        </NavLink>
        <NavLink to="/rider/profile" className={navClass} title="Profile">
          <i className="fas fa-user-circle"></i> <span className="sidebar-label">Profile</span>
        </NavLink>
        <button className="btn btn-link text-white text-start" onClick={handleLogout} style={{ textDecoration: 'none' }} title="Logout">
          <i className="fas fa-sign-out-alt"></i> <span className="sidebar-label">Logout</span>
        </button>
      </nav>
    </div>
  );
}
