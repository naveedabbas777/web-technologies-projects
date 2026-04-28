import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDelivery({ SidebarComponent = AdminSidebar }) {
  const { showAlert } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    loadDeliveryData().catch(() => {
      showAlert('Failed to load delivery data.', 'error', 'Delivery');
    });
  }, []);

  const loadDeliveryData = async () => {
    try {
      const [ordersResp, ridersResp] = await Promise.all([
        apiService.get('/orders'),
        apiService.get('/staff/riders/available')
      ]);

      setRiders(ridersResp.riders || []);

      setDeliveries((ordersResp.orders || []).map((o) => ({
        id: o._id,
        orderid: o.order_number,
        customer: o.user_id?.name || 'Customer',
        customerEmail: o.user_id?.email || '-',
        customerPhone: o.user_id?.phone || '-',
        rider: o.rider_id?.name || 'Unassigned',
        riderPhone: o.rider_id?.phone || '-',
        riderId: o.rider_id?._id || '',
        address: o.delivery_address,
        paymentMethod: o.payment_method || '-',
        paymentStatus: o.payment_status || '-',
        status: o.status,
        date: o.created_at || o.createdAt
      })));
    } catch (error) {
      setDeliveries([]);
      setRiders([]);
      showAlert(error.message || 'Failed to load delivery data.', 'error', 'Delivery');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

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
      await apiService.put(`/orders/${delivery.id}`, { status: delivery.status });
      showAlert('Delivery updated successfully.', 'success', 'Delivery saved');
      await loadDeliveryData();
    } catch (error) {
      showAlert(error.message || 'Failed to update delivery.', 'error', 'Delivery failed');
    }
  };

  return (
    <div className="admin-container">
      <SidebarComponent />
      <div className="admin-content">
        <AdminTopbar title="Delivery Management" iconClass="fas fa-truck" />
        <div className="admin-page-content">
          <div className="table-container delivery-table">
            <table className="table table-hover mb-0 admin-data-table admin-delivery-table">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Rider</th>
                  <th>Rider Contact</th>
                  <th>Address</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.orderid}</strong></td>
                    <td>{d.customer}</td>
                    <td className="admin-table-wrap">
                      <div>{d.customerEmail}</div>
                      <small className="text-muted">{d.customerPhone}</small>
                    </td>
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
                    <td>{d.riderPhone}</td>
                    <td className="admin-table-wrap">{d.address || '-'}</td>
                    <td className="admin-table-wrap">
                      <div className="text-capitalize">{String(d.paymentMethod).replace('_', ' ')}</div>
                      <span className={`badge ${d.paymentStatus === 'completed' ? 'bg-success' : d.paymentStatus === 'failed' ? 'bg-danger' : 'bg-warning text-dark'} text-capitalize`}>
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={d.status}
                        onChange={(e) => {
                          setDeliveries((prev) => prev.map((row) => row.id === d.id ? { ...row, status: e.target.value } : row));
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{formatDateTime(d.date)}</td>
                    <td className="admin-table-actions-cell">
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
  );
}
