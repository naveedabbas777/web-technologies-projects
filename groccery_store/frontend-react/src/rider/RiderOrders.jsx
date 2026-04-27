import React, { useEffect, useState } from 'react';
import RiderSidebar from '../components/RiderSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function RiderOrders() {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
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
      if (availableResp.status !== 'success') {
        setMessage(availableResp.message || 'Failed to load available orders.');
      }
      if (myResp.status !== 'success') {
        setMessage(myResp.message || 'Failed to load assigned orders.');
      }
      setAvailableOrders(availableResp.orders || []);
      setMyOrders(myResp.orders || []);
    } catch (error) {
      setMessage('Failed to load rider orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders().catch(() => {});
  }, []);

  const pickOrder = async (orderId) => {
    await apiService.post(`/orders/${orderId}/claim`, {});
    await loadOrders();
  };

  const markDelivered = async (orderId) => {
    await apiService.put(`/orders/${orderId}/status`, { status: 'delivered' });
    await loadOrders();
  };

  return (
    <div className="admin-container">
      <RiderSidebar />
      <div className="admin-content">
        <AdminTopbar title="Rider Orders" iconClass="fas fa-route" />
        <div className="admin-page-content">
          {message && <div className="alert alert-warning">{message}</div>}
          {loading && <div className="alert alert-secondary">Loading orders...</div>}

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-inbox" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Available Orders
            </h4>
            {availableOrders.length === 0 ? (
              <div className="alert alert-secondary">No available orders right now.</div>
            ) : (
              <div className="table-container">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.order_number}</td>
                        <td>{order.user_id?.name || 'Customer'}</td>
                        <td>{order.delivery_address}</td>
                        <td>Rs. {Number(order.total_amount || 0).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => pickOrder(order._id)}>
                            Pick Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-truck" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              My Orders
            </h4>
            {myOrders.length === 0 ? (
              <div className="alert alert-secondary">No assigned orders.</div>
            ) : (
              <div className="table-container">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.order_number}</td>
                        <td>{order.user_id?.name || 'Customer'}</td>
                        <td>{order.delivery_address}</td>
                        <td>{order.status}</td>
                        <td>Rs. {Number(order.total_amount || 0).toLocaleString()}</td>
                        <td>
                          {order.status !== 'delivered' && (
                            <button className="btn btn-sm btn-success" onClick={() => markDelivered(order._id)}>
                              Mark Delivered
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
