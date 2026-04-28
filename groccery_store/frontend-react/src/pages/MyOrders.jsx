import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../api/apiService.js';
import { printInvoice } from '../utils/printInvoice.js';

export default function MyOrders() {
  const { showAlert } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [cancelingId, setCancelingId] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = () =>
    apiService
      .getMyOrders()
      .then((response) => {
        if (response.status === 'success') {
          const mapped = (response.orders || []).map((order) => ({
            id: order._id,
            order_number: order.order_number,
            invoice_number: order.invoice_number,
            customer: order.user_id?.name || 'Customer',
            email: order.user_id?.email || '-',
            phone: order.user_id?.phone || '-',
            items: order.items || [],
            total: order.total_amount,
            address: order.delivery_address,
            paymentMethod: order.payment_method || 'cash',
            paymentStatus: order.payment_status || 'pending',
            status: order.status,
            created_at: order.created_at || order.createdAt
          }));
          setOrders(mapped);
        }
      })
      .catch(() => {
        setOrders([]);
        showAlert('Unable to load your orders right now.', 'error', 'Orders');
      });

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (order) => {
    if (!order?.id) {
      showAlert('Order details are missing.', 'error', 'Cancel failed');
      return;
    }
    if (order.status !== 'pending') {
      showAlert('Only pending orders can be cancelled.', 'info', 'Not allowed');
      return;
    }
    const confirmed = window.confirm('Cancel this order? This cannot be undone.');
    if (!confirmed) {
      showAlert('Order cancellation was aborted.', 'info', 'Cancelled');
      return;
    }

    setCancelingId(order.id);
    setMessage('');
    try {
      const response = await apiService.post(`/orders/${order.id}/cancel`, {});
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to cancel order');
      }
      setMessage('Order cancelled successfully.');
      showAlert('Order cancelled successfully.', 'success', 'Order updated');
      await loadOrders();
    } catch (error) {
      setMessage(error.message || 'Failed to cancel order.');
      showAlert(error.message || 'Failed to cancel order.', 'error', 'Cancel failed');
    } finally {
      setCancelingId('');
    }
  };

  const filtered = useMemo(() => {
    let list = [...orders];

    if (filter !== 'all') {
      list = list.filter((o) => o.status === filter);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((o) =>
        String(o.order_number || '').toLowerCase().includes(term)
      );
    }

    if (fromDate) {
      list = list.filter((o) => {
        const d = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '';
        return d && d >= fromDate;
      });
    }

    if (toDate) {
      list = list.filter((o) => {
        const d = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '';
        return d && d <= toDate;
      });
    }

    if (minTotal) {
      list = list.filter((o) => Number(o.total || 0) >= Number(minTotal));
    }

    if (maxTotal) {
      list = list.filter((o) => Number(o.total || 0) <= Number(maxTotal));
    }

    if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortBy === 'amount-high') {
      list.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    } else if (sortBy === 'amount-low') {
      list.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [orders, filter, search, fromDate, toDate, minTotal, maxTotal, sortBy]);

  return (
    <>
      <Navbar />
      <div className="container py-4 py-md-5 customer-orders-page">
        <div className="orders-header mb-4">
          <h1 className="mb-2">My Orders</h1>
          <p className="mb-0">Track order history, filter quickly, and manage pending orders with ease.</p>
        </div>
        {message && (
          <div className="alert alert-info" role="alert">
            {message}
          </div>
        )}
        <div className="orders-filter-card mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 className="mb-0">Advanced Filters</h5>
            <button
              type="button"
              className="btn btn-sm btn-clear-filters"
              onClick={() => {
                setFilter('all');
                setSearch('');
                setFromDate('');
                setToDate('');
                setMinTotal('');
                setMaxTotal('');
                setSortBy('newest');
              }}
            >
              Reset Filters
            </button>
          </div>
          <div className="row g-2 g-md-3">
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="orderSearch">Search Order ID</label>
              <input
                id="orderSearch"
                type="text"
                className="form-control"
                placeholder="e.g. ORD-1001"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="fromDate">From</label>
              <input
                id="fromDate"
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="toDate">To</label>
              <input
                id="toDate"
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="minTotal">Min Rs.</label>
              <input
                id="minTotal"
                type="number"
                className="form-control"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label" htmlFor="maxTotal">Max Rs.</label>
              <input
                id="maxTotal"
                type="number"
                className="form-control"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="sortBy">Sort By</label>
              <select
                id="sortBy"
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
            <div className="col-12 col-md-8 d-flex align-items-end">
              <div className="shop-results-count">{filtered.length} matching orders</div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-3 mb-3 mb-lg-4">
            <div className="list-group customer-tabs-row">
              {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  className={`list-group-item list-group-item-action customer-tab-pill ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-9">
            {filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-5x text-muted mb-3"></i>
                <p className="text-muted mb-4">You have not placed any orders yet.</p>
              </div>
            ) : (
              filtered.map((order) => {
                const date = new Date(order.created_at);
                return (
                  <div className="card mb-3 shadow-sm customer-order-card" key={order.order_number}>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <h6 className="fw-bold">Order #{order.order_number}</h6>
                          <p className="text-muted mb-2">Invoice #{order.invoice_number || 'Pending'}</p>
                          <p className="text-muted mb-2">Placed on {date.toLocaleDateString()}</p>
                          <p className="text-muted mb-0">Items: {order.items.length}</p>
                        </div>
                        <div className="col-md-3">
                          <p className="mb-0 fw-bold text-primary">Rs. {order.total.toFixed(2)}</p>
                          <p className="text-muted small">Total Amount</p>
                        </div>
                        <div className="col-md-3 text-end">
                          <span className="badge bg-secondary mb-2">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <div className="d-flex gap-2 justify-content-end mb-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark"
                              onClick={() =>
                                printInvoice(order, {
                                  title: 'Customer Invoice',
                                  subtitle: 'Order Receipt'
                                })
                              }
                            >
                              <i className="fas fa-print"></i> Print Invoice
                            </button>
                          </div>
                          {order.status === 'pending' && (
                            <div>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => cancelOrder(order)}
                                disabled={cancelingId === order.id}
                              >
                                {cancelingId === order.id ? 'Canceling...' : 'Cancel Order'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
