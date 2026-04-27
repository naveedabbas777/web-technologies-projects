import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { printInvoice } from '../utils/printInvoice.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminOrders({ SidebarComponent = AdminSidebar }) {
  const { showAlert } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadOrders().catch(() => {
      showAlert('Failed to load orders.', 'error', 'Orders');
    });
  }, []);

  const loadOrders = async () => {
    try {
      const response = await apiService.get('/orders');
      const source = response.orders || [];
      setOrders(source.map((o) => ({
        id: o._id,
        order_number: o.order_number,
        invoice_number: o.invoice_number,
        customer: o.user_id?.name || 'Customer',
        email: o.user_id?.email || '-',
        phone: o.user_id?.phone || '-',
        rider: o.rider_id?.name || '-',
        items: o.items || [],
        itemCount: (o.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        itemLines: (o.items || []).length,
        total: Number(o.total_amount || 0),
        status: o.status,
        paymentMethod: o.payment_method || '-',
        paymentStatus: o.payment_status || '-',
        date: o.created_at || o.createdAt,
        address: o.delivery_address
      })));
    } catch (error) {
      setOrders([]);
      showAlert(error.message || 'Failed to load orders.', 'error', 'Orders');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const statusSummary = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1;
      }
    });
    return counts;
  }, [orders]);

  const updateStatus = async (id, status) => {
    try {
      if (!id) {
        showAlert('Order ID is missing.', 'error', 'Invalid action');
        return;
      }
      if (!status) {
        showAlert('Please choose a valid status.', 'error', 'Invalid action');
        return;
      }
      await apiService.put(`/orders/${id}`, { status });
      showAlert('Order status updated successfully.', 'success', 'Order updated');
      await loadOrders();
    } catch (error) {
      showAlert(error.message || 'Failed to update order status.', 'error', 'Update failed');
    }
  };

  const cancelOrder = async (id) => {
    if (!id) {
      showAlert('Order ID is missing.', 'error', 'Invalid action');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      showAlert('Order cancellation was aborted.', 'info', 'Cancelled');
      return;
    }

    try {
      await apiService.post(`/orders/${id}/cancel`, {});
      showAlert('Order cancelled successfully.', 'success', 'Order updated');
      await loadOrders();
    } catch (error) {
      showAlert(error.message || 'Failed to cancel order.', 'error', 'Cancel failed');
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const data = [
      statusSummary.pending,
      statusSummary.confirmed,
      statusSummary.shipped,
      statusSummary.delivered,
      statusSummary.cancelled
    ];

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        datasets: [
          {
            data,
            backgroundColor: ['#fbbf24', '#38bdf8', '#a78bfa', '#22c55e', '#f87171'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#475569' } }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return undefined;
    };
  }, [JSON.stringify(statusSummary)]);

  return (
    <div className="admin-container">
      <SidebarComponent />
      <div className="admin-content">
        <AdminTopbar title="Order Management" iconClass="fas fa-receipt" />
        <div className="admin-page-content">
          <div className="container-fluid">
            <div className="stats-card">
              <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
                <i className="fas fa-chart-pie" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                Orders by Status
              </h4>
              <div className="orders-status-grid">
                <div className="orders-status-chart">
                  <canvas ref={canvasRef} />
                </div>
                <div className="orders-status-list">
                  <div className="status-row">
                    <span className="status-dot pending"></span> Pending
                    <strong>{statusSummary.pending}</strong>
                  </div>
                  <div className="status-row">
                    <span className="status-dot confirmed"></span> Confirmed
                    <strong>{statusSummary.confirmed}</strong>
                  </div>
                  <div className="status-row">
                    <span className="status-dot shipped"></span> Shipped
                    <strong>{statusSummary.shipped}</strong>
                  </div>
                  <div className="status-row">
                    <span className="status-dot delivered"></span> Delivered
                    <strong>{statusSummary.delivered}</strong>
                  </div>
                  <div className="status-row">
                    <span className="status-dot cancelled"></span> Cancelled
                    <strong>{statusSummary.cancelled}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Order ID or Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="table-container orders-table">
              <table className="table table-hover mb-0 admin-data-table admin-orders-table admin-orders-compact">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Rider</th>
                    <th>Address</th>
                    <th>Date</th>
                    <th className="admin-table-actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td data-label="Order #"><strong>{o.order_number}</strong></td>
                      <td data-label="Invoice #">{o.invoice_number || '-'}</td>
                      <td data-label="Customer">{o.customer}</td>
                      <td className="admin-table-wrap" data-label="Contact">
                        <div>{o.email}</div>
                        <small className="text-muted">{o.phone}</small>
                      </td>
                      <td data-label="Items">{o.itemCount} qty ({o.itemLines} lines)</td>
                      <td data-label="Total">Rs. {o.total.toFixed(2)}</td>
                      <td className="admin-table-wrap" data-label="Payment">
                        <div className="text-capitalize">{String(o.paymentMethod).replace('_', ' ')}</div>
                        <span className={`badge ${o.paymentStatus === 'completed' ? 'bg-success' : o.paymentStatus === 'failed' ? 'bg-danger' : 'bg-warning text-dark'} text-capitalize`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge text-capitalize ${o.status === 'delivered' ? 'bg-success' : o.status === 'cancelled' ? 'bg-danger' : o.status === 'pending' ? 'bg-warning text-dark' : 'bg-info'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td data-label="Rider">{o.rider}</td>
                      <td className="admin-table-wrap" data-label="Address">{o.address || '-'}</td>
                      <td data-label="Date">{formatDateTime(o.date)}</td>
                      <td className="admin-table-actions-cell" data-label="Actions">
                        <select
                          className="form-select form-select-sm admin-status-select"
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          className="btn btn-sm btn-outline-dark mt-2 me-2"
                          onClick={() =>
                            printInvoice(o, {
                              title: 'Admin Invoice',
                              subtitle: 'Order Billing'
                            })
                          }
                        >
                          <i className="fas fa-print"></i> Print
                        </button>
                        <button className="btn btn-sm btn-danger mt-2" onClick={() => cancelOrder(o.id)}>
                          Cancel
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
