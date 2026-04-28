import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminTopbar({ title, iconClass, actions = null }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName =
    user?.name ||
    user?.fullName ||
    (user?.email ? user.email.split('@')[0] : 'Admin User');
  const avatarLetter = (displayName || 'A').charAt(0).toUpperCase();
  const role = user?.role;
  const profilePath = role === 'rider'
    ? '/rider/profile'
    : role === 'staff'
      ? '/staff/profile'
      : '/admin/profile';
  const showSettings = role === 'admin';

  const closeMobileSidebar = () => {
    document.body.classList.remove('mobile-sidebar-open');
  };

  const toggleMobileSidebar = () => {
    document.body.classList.toggle('mobile-sidebar-open');
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 769px)');

    const syncSidebarMode = () => {
      if (mediaQuery.matches) {
        document.body.classList.add('sidebar-hover-expand');
        document.body.classList.remove('mobile-sidebar-open');
      } else {
        document.body.classList.remove('sidebar-hover-expand');
      }
    };

    syncSidebarMode();
    mediaQuery.addEventListener('change', syncSidebarMode);

    return () => {
      document.body.classList.remove('sidebar-hover-expand');
      document.body.classList.remove('mobile-sidebar-open');
      mediaQuery.removeEventListener('change', syncSidebarMode);
    };
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="admin-topbar">
      <h2>
        <button
          type="button"
          className="mobile-sidebar-toggle"
          aria-label="Toggle sidebar menu"
          onClick={toggleMobileSidebar}
        >
          <i className="fas fa-bars"></i>
        </button>
        <i className={iconClass}></i> {title}
      </h2>
      <div className="admin-topbar-right">
        {actions}
        <div
          className="admin-user-info"
          ref={menuRef}
        >
          <span className="admin-user-name">{displayName}</span>
          <button
            className="admin-user-btn"
            type="button"
            aria-expanded={menuOpen ? 'true' : 'false'}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="admin-user-avatar" aria-hidden="true">{avatarLetter}</span>
          </button>
          <div
            className={`admin-user-menu${menuOpen ? ' show' : ''}`}
          >
            <NavLink className="admin-user-link" to={profilePath}>
              <i className="fas fa-user"></i> Profile
            </NavLink>
            {showSettings && (
              <NavLink className="admin-user-link" to="/admin/settings">
                <i className="fas fa-cog"></i> Settings
              </NavLink>
            )}
            <button className="admin-user-logout" type="button" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
