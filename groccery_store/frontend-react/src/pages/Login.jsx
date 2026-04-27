import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LOGO_PATH, SITE_NAME } from '../constants/branding.js';

export default function Login() {
  const { login, user, showAlert } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === '1') {
      setInfoMessage('Account created successfully. Please log in.');
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else if (user.role === 'rider') {
        navigate('/rider');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please fill in all fields.');
      showAlert('Please fill in all fields before logging in.', 'error', 'Missing input');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setMessage('Please enter a valid email address.');
      showAlert('Please enter a valid email address.', 'error', 'Invalid email');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const userData = await login(normalizedEmail, password);
      showAlert(`Welcome back, ${userData.name || 'user'}!`, 'success', 'Login successful');
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (redirect === 'profile') {
        navigate('/profile');
      } else if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'staff') {
        navigate('/staff');
      } else if (userData.role === 'rider') {
        navigate('/rider');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage(error.message || 'Invalid email or password.');
      showAlert(error.message || 'Invalid email or password.', 'error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow" style={{ marginTop: '50px' }}>
              <div
                className="card-body p-5"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <h1 className="text-center text-white mb-4">
                  <img
                    src={LOGO_PATH}
                    alt={SITE_NAME}
                    className="auth-brand-logo"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  {SITE_NAME}
                </h1>
                <p className="text-center text-white-50 mb-5">Welcome Back! Login to your account</p>

                {infoMessage && (
                  <div className="alert alert-success" role="status" aria-live="polite">
                    {infoMessage}
                  </div>
                )}

                {message && (
                  <div className="alert alert-warning alert-dismissible fade show" role="alert" aria-live="assertive">
                    {message}
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="login-email">Email Address</label>
                    <input
                      id="login-email"
                      type="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      autoComplete="email"
                      inputMode="email"
                      aria-describedby="login-help"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-bold" htmlFor="login-password">Password</label>
                    <div className="password-toggle-wrap">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-describedby="login-help"
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
                    <small id="login-help" className="text-white-50 d-block mt-2">
                      Use your registered email and password.
                    </small>
                  </div>

                  <button type="submit" className="btn btn-light btn-lg w-100 fw-bold mb-3" disabled={loading}>
                    <i className="fas fa-sign-in-alt"></i> {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <hr className="bg-white-50" />

                <p className="text-center text-white mb-2">
                  Do not have an account?{' '}
                  <Link to="/register" className="text-white fw-bold">
                    Register here
                  </Link>
                </p>
                <p className="text-center text-white-50 mb-0">
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
