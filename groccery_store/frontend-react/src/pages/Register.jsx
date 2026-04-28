import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, user, showAlert } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    agree: false
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const normalizedEmail = form.email.trim().toLowerCase();

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.address || !form.password) {
      setMessage('Please fill in all fields.');
      showAlert('Please complete all required fields.', 'error', 'Missing input');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      showAlert('Passwords do not match.', 'error', 'Check passwords');
      return;
    }

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordPolicy.test(form.password)) {
      setMessage('Password must be at least 8 characters with uppercase, lowercase, number, and symbol.');
      showAlert('Use a stronger password (8+ chars with upper/lowercase, number, and symbol).', 'error', 'Weak password');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setMessage('Please enter a valid email address.');
      showAlert('Please enter a valid email address.', 'error', 'Invalid email');
      return;
    }

    if (!form.agree) {
      setMessage('Please accept the terms and conditions.');
      showAlert('Please accept the terms and conditions before continuing.', 'error', 'Confirmation required');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: normalizedEmail,
        phone: form.phone,
        address: form.address,
        password: form.password
      });
      showAlert('Account created successfully. Please log in.', 'success', 'Registration complete');
      navigate('/login?registered=1');
    } catch (error) {
      setMessage(error.message || 'Registration failed.');
      showAlert(error.message || 'Registration failed.', 'error', 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow" style={{ marginTop: '30px' }}>
              <div
                className="card-body p-5"
                style={{ background: 'linear-gradient(135deg, #2f9e44 0%, #1f7a32 100%)' }}
              >
                <h1 className="text-center text-white mb-4">
                  <i className="fas fa-user-plus"></i> Create Account
                </h1>
                <p className="text-center text-white-50 mb-5">Join Fresh Grocery and start shopping</p>

                {message && (
                  <div className="alert alert-warning alert-dismissible fade show" role="alert" aria-live="assertive">
                    {message}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label text-white fw-bold" htmlFor="register-first-name">First Name</label>
                      <input
                        id="register-first-name"
                        type="text"
                        className="form-control form-control-lg"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="First Name"
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label text-white fw-bold" htmlFor="register-last-name">Last Name</label>
                      <input
                        id="register-last-name"
                        type="text"
                        className="form-control form-control-lg"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Last Name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="register-email">Email Address</label>
                    <input
                      id="register-email"
                      type="email"
                      className="form-control form-control-lg"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="register-phone">Phone Number</label>
                    <input
                      id="register-phone"
                      type="tel"
                      className="form-control form-control-lg"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="03001234567"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="register-address">Address</label>
                    <input
                      id="register-address"
                      type="text"
                      className="form-control form-control-lg"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      required
                      placeholder="Your full address"
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="register-password">Password</label>
                    <div className="password-toggle-wrap">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Min 8 chars, include A-z, 0-9, symbol"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <small className="text-white-50 d-block mt-2">
                      Use at least 8 characters with uppercase, lowercase, number, and symbol.
                    </small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="register-confirm-password">Confirm Password</label>
                    <div className="password-toggle-wrap">
                      <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Confirm password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        id="register-agree"
                        className="form-check-input"
                        type="checkbox"
                        name="agree"
                        checked={form.agree}
                        onChange={handleChange}
                        required
                      />
                      <label className="form-check-label text-white" htmlFor="register-agree">I agree to the Terms and Conditions</label>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-light btn-lg w-100 fw-bold mb-3" disabled={loading} style={{ backgroundColor: '#ffd43b', color: '#102117', border: 'none', fontWeight: '700' }}>
                    <i className="fas fa-user-check"></i> {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>

                <hr className="bg-white-50" />

                <p className="text-center text-white mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="text-white fw-bold">
                    Login here
                  </Link>
                </p>
                <p className="text-center text-white-50 mt-3 mb-0">
                  <Link to="/" className="text-white-50">
                    Back to Home
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
