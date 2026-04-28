import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { LOGO_PATH, SITE_NAME } from '../constants/branding.js';

export default function Navbar() {
  const { user, logout, unreadMessageCount } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      setMenuOpen(false);
      setNavOpen(false);
      navigate('/');
    }
  };

  const closeMobileNav = () => {
    setNavOpen(false);
  };

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

  useEffect(() => {
    setMenuOpen(false);
    setNavOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) =>
    `nav-link grocery-nav-link${isActive ? ' active' : ''}`;
  const isCustomer = !user || user.role === 'customer';
  const showCustomerDashboard = user && user.role === 'customer';
  const dashboardPath = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'staff'
      ? '/staff'
      : user?.role === 'rider' || user?.role === 'delivery_rider'
        ? '/rider'
        : '/dashboard';

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top grocery-navbar">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold grocery-brand" to="/">
          <img
            src={LOGO_PATH}
            alt={SITE_NAME}
            className="brand-logo"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <span>{SITE_NAME}</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-controls="navbarNav"
          aria-expanded={navOpen ? 'true' : 'false'}
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`navbar-collapse collapse${navOpen ? ' show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {isCustomer && (
              <li className="nav-item">
                <NavLink className={navClass} to="/" onClick={closeMobileNav}>
                  Home
                </NavLink>
              </li>
            )}
            {isCustomer && (
              <li className="nav-item">
                <NavLink className={navClass} to="/products" onClick={closeMobileNav}>
                  Shop
                </NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className={navClass} to="/about" onClick={closeMobileNav}>
                About
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={navClass} to="/contact" onClick={closeMobileNav}>
                Contact
              </NavLink>
            </li>
            {user && user.role === 'customer' && (
              <li className="nav-item">
                <NavLink
                  className="nav-link grocery-nav-link position-relative"
                  to="/cart"
                  onClick={closeMobileNav}
                >
                  <i className="fas fa-shopping-bag"></i> Cart
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill grocery-cart-badge"
                    id="cartCount"
                  >
                    {cartCount}
                  </span>
                </NavLink>
              </li>
            )}
            {user && user.role === 'customer' && (
              <li className="nav-item">
                <NavLink className={navClass} to="/my-orders" onClick={closeMobileNav}>
                  <i className="fas fa-box"></i> My Orders
                </NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link grocery-nav-link position-relative" to="/messages" onClick={closeMobileNav}>
                  <i className="fas fa-comments"></i> Messages
                  {unreadMessageCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill grocery-cart-badge">
                      {unreadMessageCount}
                    </span>
                  )}
                </NavLink>
              </li>
            )}
            <li className="nav-item dropdown" ref={menuRef}>
              <button
                className="nav-link grocery-nav-link dropdown-toggle btn btn-link nav-tab-compact"
                type="button"
                aria-expanded={menuOpen ? 'true' : 'false'}
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-user-circle"></i> Account
              </button>
              <ul className={`dropdown-menu dropdown-menu-end${menuOpen ? ' show' : ''}`}>
                {!user && (
                  <>
                    <li>
                      <NavLink className="dropdown-item" to="/login" onClick={closeMobileNav}>
                        <i className="fas fa-sign-in-alt"></i> Login
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/register" onClick={closeMobileNav}>
                        <i className="fas fa-user-plus"></i> Register
                      </NavLink>
                    </li>
                  </>
                )}
                {user && (
                  <>
                    {showCustomerDashboard ? (
                      <>
                        <li>
                          <NavLink className="dropdown-item" to="/dashboard" onClick={closeMobileNav}>
                            <i className="fas fa-chart-line"></i> Dashboard
                          </NavLink>
                        </li>
                        <li>
                          <NavLink className="dropdown-item" to="/profile" onClick={closeMobileNav}>
                            <i className="fas fa-user"></i> My Profile
                          </NavLink>
                        </li>
                        <li>
                          <NavLink className="dropdown-item" to="/my-orders" onClick={closeMobileNav}>
                            <i className="fas fa-box"></i> My Orders
                          </NavLink>
                        </li>
                      </>
                    ) : (
                      <li>
                        <NavLink className="dropdown-item" to={dashboardPath} onClick={closeMobileNav}>
                          <i className="fas fa-chart-line"></i> Dashboard
                        </NavLink>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
