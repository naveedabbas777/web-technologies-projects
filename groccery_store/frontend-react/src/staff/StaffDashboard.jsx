import React, { useEffect, useState } from 'react';
import StaffSidebar from '../components/StaffSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffDashboard() {
  const { showAlert } = useAuth();
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0
  });
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [ordersResp, productsResp, ridersResp] = await Promise.all([
          apiService.get('/orders?limit=500'),
          apiService.get('/products?limit=500'),
          apiService.get('/staff/riders/available')
        ]);

        const orders = ordersResp.orders || [];
        const products = productsResp.products || productsResp.data || [];
        const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
        const shippedOrders = orders.filter((o) => o.status === 'shipped').length;

        setRiders(ridersResp.riders || []);
        setDeliveries(orders.map((o) => ({
          id: o._id,
          orderid: o.order_number,
          customer: o.user_id?.name || 'Customer',
          rider: o.rider_id?.name || 'Unassigned',
          riderId: o.rider_id?._id || '',
          address: o.delivery_address,
          status: o.status === 'shipped' ? 'in-transit' : o.status
        })));

        setSummary({
          totalOrders: orders.length,
          pendingOrders,
          shippedOrders,
          totalProducts: products.length
        });
      } catch (error) {
        setMessage('Failed to load staff dashboard data.');
        showAlert('Failed to load staff dashboard data.', 'error', 'Dashboard');
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});
  }, []);

  const updateDelivery = async (delivery) => {
    if (!delivery?.id) {
      showAlert('Order ID is missing.', 'error', 'Invalid action');
      return;
    }
    if (!delivery.status) {
      showAlert('Please choose a delivery status.', 'error', 'Invalid action');
      return;
    }

    try {
      if (delivery.riderId) {
        await apiService.post(`/orders/${delivery.id}/assign-rider`, { riderId: delivery.riderId });
      }
      const statusForApi = delivery.status === 'in-transit' ? 'shipped' : delivery.status;
      await apiService.put(`/orders/${delivery.id}`, { status: statusForApi });
      showAlert('Delivery assignment updated successfully.', 'success', 'Dashboard');
      const ordersResp = await apiService.get('/orders?limit=500');
      setDeliveries((ordersResp.orders || []).map((o) => ({
        id: o._id,
        orderid: o.order_number,
        customer: o.user_id?.name || 'Customer',
        rider: o.rider_id?.name || 'Unassigned',
        riderId: o.rider_id?._id || '',
        address: o.delivery_address,
        status: o.status === 'shipped' ? 'in-transit' : o.status
      })));
    } catch (error) {
      showAlert(error.message || 'Failed to update delivery assignment.', 'error', 'Dashboard');
    }
  };

  return (
    <div className="admin-container">
      <StaffSidebar />
      <div className="admin-content">
        <AdminTopbar title="Staff Dashboard" iconClass="fas fa-clipboard-list" />
        <div className="admin-page-content">
          {message && <div className="alert alert-warning">{message}</div>}
          {loading && <div className="alert alert-secondary">Loading dashboard...</div>}
          <div className="stats-cards-grid">
            <div className="stats-card gradient">
              <h3>Total Orders</h3>
              <div className="value">{summary.totalOrders}</div>
            </div>
            <div className="stats-card gradient" style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb7185 100%)' }}>
              <h3>Pending Orders</h3>
              <div className="value">{summary.pendingOrders}</div>
            </div>
            <div className="stats-card gradient" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' }}>
              <h3>Shipped Orders</h3>
              <div className="value">{summary.shippedOrders}</div>
            </div>
            <div className="stats-card gradient" style={{ background: 'linear-gradient(135deg, #ffd43b 0%, #2f9e44 100%)' }}>
              <h3>Total Products</h3>
              <div className="value">{summary.totalProducts}</div>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-bolt" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Quick Actions
            </h4>
            <div className="d-flex flex-wrap gap-2">
              <a className="btn btn-primary" href="/staff/products">Manage Products</a>
              <a className="btn btn-secondary" href="/staff/orders">View Orders</a>
              <a className="btn btn-outline-primary" href="/staff/sales">View Sales</a>
              <a className="btn btn-outline-secondary" href="/staff/customers">View Customers</a>
              <a className="btn btn-info" href="/staff/delivery">Assign Rider</a>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-truck" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Order Assignments
            </h4>
            <div className="delivery-table">
              <table className="table table-hover mb-0 admin-data-table admin-delivery-table">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Rider</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.orderid}</strong></td>
                      <td>{d.customer}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={d.riderId}
                          onChange={(e) => {
                            setDeliveries((prev) => prev.map((row) => row.id === d.id ? { ...row, riderId: e.target.value } : row));
                          }}
                        >
                          <option value="">Unassigned</option>
                          {riders.map((r) => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>{d.address}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={d.status}
                          onChange={(e) => {
                            setDeliveries((prev) => prev.map((row) => row.id === d.id ? { ...row, status: e.target.value } : row));
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => updateDelivery(d)}>
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
