import React, { useEffect, useState } from 'react';
import RiderSidebar from '../components/RiderSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function RiderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const resp = await apiService.get('/orders/rider/my-orders');
        const all = resp.orders || [];
        const delivered = all.filter((o) => o.status === 'delivered');
        setOrders(delivered);
      } catch (error) {
        setMessage('Failed to load delivery history.');
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});
  }, []);

  return (
    <div className="admin-container">
      <RiderSidebar />
      <div className="admin-content">
        <AdminTopbar title="Delivery History" iconClass="fas fa-history" />
        <div className="admin-page-content">
          {message && <div className="alert alert-warning">{message}</div>}
          {loading && <div className="alert alert-secondary">Loading deliveries...</div>}
          <div className="table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.order_number}</td>
                    <td>{order.user_id?.name || 'Customer'}</td>
                    <td>{order.delivery_address}</td>
                    <td>Rs. {Number(order.total_amount || 0).toLocaleString()}</td>
                    <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No delivered orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
