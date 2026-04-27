import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { apiService } from '../api/apiService.js';

export default function Contact() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    agree: false
  });
  const [feedback, setFeedback] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.subject || !form.message) {
      setFeedback('Please fill in all required fields.');
      return;
    }

    if (!form.agree) {
      setFeedback('Please agree to be contacted.');
      return;
    }

    try {
      const response = await apiService.post('/contact', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message
      });

      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to send message');
      }

      setFeedback('Message sent successfully. We will contact you soon.');
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '', agree: false });
    } catch (error) {
      setFeedback(error.message || 'Failed to send message.');
    }
  };

  return (
    <>
      <Navbar />
      <section
        className="hero-section"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold mb-4">Contact Us</h1>
          <p className="lead">We would love to hear from you. Get in touch today.</p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-md-8 mx-auto">
              <h2 className="text-center fw-bold mb-5">Send us a Message</h2>
              <div className="card shadow">
                <div className="card-body p-5">
                  <form onSubmit={handleSubmit}>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Full Name</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Email</label>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-lg"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Subject</label>
                      <select
                        className="form-select form-select-lg"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="delivery">Delivery Issue</option>
                        <option value="product">Product Quality</option>
                        <option value="payment">Payment Issue</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Message</label>
                      <textarea
                        className="form-control"
                        name="message"
                        rows="6"
                        value={form.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="agree"
                          checked={form.agree}
                          onChange={handleChange}
                        />
                        <label className="form-check-label">I agree to be contacted via email or phone</label>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100">
                      <i className="fas fa-paper-plane"></i> Send Message
                    </button>
                  </form>
                  {feedback && (
                    <div className="alert alert-info mt-3" role="alert">
                      {feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
