import React from 'react';
import { Link } from 'react-router-dom';
import { LOGO_PATH, SITE_NAME } from '../constants/branding.js';

export default function Footer() {
  return (
    <footer className="grocery-footer py-5">
      <div className="container">
        <div className="row">
          <div className="col-md-3 mb-4">
            <h5 className="footer-brand-title">
              <img
                src={LOGO_PATH}
                alt={SITE_NAME}
                className="footer-brand-logo"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              {SITE_NAME}
            </h5>
            <p>Your trusted online grocery delivery platform</p>
          </div>
          <div className="col-md-3 mb-4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li>
                <Link className="grocery-footer-link text-decoration-none" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="grocery-footer-link text-decoration-none" to="/contact">
                  Contact
                </Link>
              </li>
              <li>
                <a className="grocery-footer-link text-decoration-none" href="#">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a className="grocery-footer-link text-decoration-none" href="#">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div className="col-md-3 mb-4">
            <h5>Contact Us</h5>
            <p className="grocery-footer-muted">
              <i className="fas fa-phone"></i> +92-300-1234567
              <br />
              <i className="fas fa-envelope"></i> info@freshgrocery.com
              <br />
              <i className="fas fa-map"></i> Karachi, Pakistan
            </p>
          </div>
          <div className="col-md-3 mb-4">
            <h5>Follow Us</h5>
            <a className="grocery-footer-link me-3" href="#">
              <i className="fab fa-facebook fa-lg"></i>
            </a>
            <a className="grocery-footer-link me-3" href="#">
              <i className="fab fa-twitter fa-lg"></i>
            </a>
            <a className="grocery-footer-link me-3" href="#">
              <i className="fab fa-instagram fa-lg"></i>
            </a>
            <a className="grocery-footer-link" href="#">
              <i className="fab fa-linkedin fa-lg"></i>
            </a>
          </div>
        </div>
        <hr className="grocery-footer-divider" />
        <div className="text-center">
          <p className="grocery-footer-muted mb-0">Copyright 2026 {SITE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
