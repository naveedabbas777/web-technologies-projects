import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <>
      <Navbar />
      <section
        className="hero-section"
        style={{
          background: 'linear-gradient(135deg, #2f9e44 0%, #1f7a32 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold mb-4">About Fresh Grocery</h1>
          <p className="lead">Your trusted partner for quality groceries delivered to your doorstep</p>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row align-items-center mb-5">
            <div className="col-md-6">
              <img
                src="https://via.placeholder.com/500x400"
                alt="Fresh Grocery"
                className="img-fluid rounded"
                style={{ maxHeight: '400px' }}
              />
            </div>
            <div className="col-md-6">
              <h2 className="fw-bold mb-4">Who We Are</h2>
              <p className="mb-3">
                Fresh Grocery is a leading online grocery delivery service committed to providing high-quality
                groceries and household essentials to your doorstep.
              </p>
              <p className="mb-3">
                Founded in 2020, we started with a vision to make grocery shopping convenient, affordable,
                and accessible to everyone.
              </p>
              <p>
                Our mission is to deliver an exceptional shopping experience that saves time and brings
                happiness to every household.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Our Mission and Vision</h2>
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="fas fa-bullseye fa-3x mb-3" style={{ color: '#2f9e44' }}></i>
                  <h5 className="card-title fw-bold">Our Mission</h5>
                  <p className="card-text">
                    To provide the highest quality groceries with exceptional service, making shopping
                    convenient and affordable for every family.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body text-center">
                  <i className="fas fa-eye fa-3x mb-3" style={{ color: '#ffd43b' }}></i>
                  <h5 className="card-title fw-bold">Our Vision</h5>
                  <p className="card-text">
                    To become the most trusted online grocery platform by embodying innovation, quality,
                    and customer satisfaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-4">Ready to Experience Fresh Grocery?</h2>
          <p className="lead mb-4">Start shopping now and get your favorite groceries delivered fast.</p>
          <div>
            <Link to="/products" className="btn btn-primary btn-lg me-3 mb-2">
              <i className="fas fa-shopping-bag"></i> Start Shopping
            </Link>
            <Link to="/contact" className="btn btn-outline-primary btn-lg mb-2">
              <i className="fas fa-envelope"></i> Contact Us
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
