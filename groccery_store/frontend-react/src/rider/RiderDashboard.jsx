import React, { useEffect, useState } from 'react';
import RiderSidebar from '../components/RiderSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function RiderDashboard() {
  const [summary, setSummary] = useState({
    available: 0,
    assigned: 0,
    delivered: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [availableResp, myResp] = await Promise.all([
        apiService.get('/orders/rider/available'),
        apiService.get('/orders/rider/my-orders')
      ]);
      const availableOrders = availableResp.orders || [];
      const myOrders = myResp.orders || [];
      const delivered = myOrders.filter((o) => o.status === 'delivered').length;
      setSummary({
        available: availableOrders.length,
        assigned: myOrders.length,
        delivered
      });
    } catch (error) {
      setMessage('Failed to load rider orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders().catch(() => {});
  }, []);

  return (
    <div className="admin-container">
      <RiderSidebar />
      <div className="admin-content">
        <AdminTopbar title="Rider Dashboard" iconClass="fas fa-motorcycle" />
        <div className="admin-page-content">
          {message && <div className="alert alert-warning">{message}</div>}
          {loading && <div className="alert alert-secondary">Loading orders...</div>}
          <div className="stats-cards-grid">
            <div className="stats-card gradient">
              <h3>Available Orders</h3>
              <div className="value">{summary.available}</div>
            </div>
            <div className="stats-card gradient" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' }}>
              <h3>Assigned Orders</h3>
              <div className="value">{summary.assigned}</div>
            </div>
            <div className="stats-card gradient" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}>
              <h3>Delivered Orders</h3>
              <div className="value">{summary.delivered}</div>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-bolt" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Quick Actions
            </h4>
            <div className="d-flex flex-wrap gap-2">
              <a className="btn btn-primary" href="/rider/orders">View Orders</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
