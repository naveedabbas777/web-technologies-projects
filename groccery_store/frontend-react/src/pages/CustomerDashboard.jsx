import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { printInvoice } from '../utils/printInvoice.js';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [period, setPeriod] = useState('daily');
  const [liveStatus, setLiveStatus] = useState('');
  const socketRef = useRef(null);
  const trendCanvasRef = useRef(null);
  const statusCanvasRef = useRef(null);
  const trendChartRef = useRef(null);
  const statusChartRef = useRef(null);

  const loadOrders = async () => {
    const response = await apiService.getMyOrders();
    const mapped = (response.orders || []).map((order) => ({
      id: order._id,
      orderNumber: order.order_number,
      invoiceNumber: order.invoice_number,
      items: order.items || [],
      total: Number(order.total_amount || 0),
      status: order.status,
      date: order.created_at || order.createdAt,
      address: order.delivery_address || '',
      customer: user?.name || 'Customer',
      email: user?.email || '-',
      phone: user?.phone || '-',
      paymentMethod: order.payment_method || 'cash',
      paymentStatus: order.payment_status || 'pending'
    }));
    setOrders(mapped);
  };

  useEffect(() => {
    let isMounted = true;
    loadOrders()
      .catch(() => {
        if (!isMounted) return;
        setOrders([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    const socketBase = apiService.baseURL.replace(/\/api\/?$/, '');
    if (!socketRef.current) {
      socketRef.current = io(socketBase, { transports: ['websocket'] });
    }
    const socket = socketRef.current;
    socket.on('orders:changed', () => {
      setLiveStatus('Live update: order status refreshed.');
      loadOrders().catch(() => {});
    });

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('orders:changed');
      }
    };
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const pending = orders.filter((order) => order.status === 'pending').length;
    const delivered = orders.filter((order) => order.status === 'delivered').length;
    return { totalOrders, totalSpent, pending, delivered };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
      const matchesSearch = order.orderNumber?.toLowerCase().includes(search.toLowerCase());
      const orderDate = order.date ? new Date(order.date) : null;
      const matchesFrom = fromDate
        ? orderDate && orderDate.toISOString().slice(0, 10) >= fromDate
        : true;
      const matchesTo = toDate
        ? orderDate && orderDate.toISOString().slice(0, 10) <= toDate
        : true;
      return matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [orders, statusFilter, search, fromDate, toDate]);

  const recentOrders = useMemo(() => {
    return [...filteredOrders]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [filteredOrders]);

  const statusCounts = useMemo(() => {
    const map = new Map();
    filteredOrders.forEach((order) => {
      map.set(order.status, (map.get(order.status) || 0) + 1);
    });
    return {
      labels: Array.from(map.keys()),
      data: Array.from(map.values())
    };
  }, [filteredOrders]);

  const trendSeries = useMemo(() => {
    const totals = new Map();
    filteredOrders.forEach((order) => {
      const orderDate = order.date ? new Date(order.date) : null;
      if (!orderDate) return;
      let key = '';
      if (period === 'weekly') {
        const weekStart = new Date(orderDate);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
        key = `W-${weekStart.toISOString().slice(0, 10)}`;
      } else if (period === 'monthly') {
        key = `M-${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'yearly') {
        key = `Y-${orderDate.getFullYear()}`;
      } else {
        key = `D-${orderDate.toISOString().slice(0, 10)}`;
      }
      totals.set(key, (totals.get(key) || 0) + order.total);
    });

    const entries = Array.from(totals.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = entries.map(([key]) => {
      if (key.startsWith('W-')) {
        const date = new Date(key.replace('W-', ''));
        const end = new Date(date);
        end.setDate(end.getDate() + 6);
        return `${date.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      if (key.startsWith('M-')) {
        const [year, month] = key.replace('M-', '').split('-').map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }
      if (key.startsWith('Y-')) {
        return key.replace('Y-', '');
      }
      return key.replace('D-', '');
    });

    return {
      labels,
      data: entries.map(([, value]) => value)
    };
  }, [filteredOrders, period]);

  useEffect(() => {
    if (!trendCanvasRef.current) return undefined;
    if (trendChartRef.current) {
      trendChartRef.current.destroy();
    }

    trendChartRef.current = new Chart(trendCanvasRef.current, {
      type: 'line',
      data: {
        labels: trendSeries.labels,
        datasets: [
          {
            label: 'Spending (Rs.)',
            data: trendSeries.data,
            borderColor: '#2f9e44',
            backgroundColor: 'rgba(47, 158, 68, 0.16)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#66a80f',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#3f5a2c', maxRotation: 0 } },
          y: {
            beginAtZero: true,
            grid: { color: '#e1eecf' },
            ticks: { color: '#3f5a2c' },
            title: {
              display: true,
              text: 'Amount (Rs.)',
              color: '#2b3a22',
              font: { size: 12, weight: '600' }
            }
          }
        }
      }
    });

    return () => {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
        trendChartRef.current = null;
      }
      return undefined;
    };
  }, [JSON.stringify(trendSeries)]);

  useEffect(() => {
    if (!statusCanvasRef.current) return undefined;
    if (statusChartRef.current) {
      statusChartRef.current.destroy();
    }

    statusChartRef.current = new Chart(statusCanvasRef.current, {
      type: 'doughnut',
      data: {
        labels: statusCounts.labels,
        datasets: [
          {
            data: statusCounts.data,
            backgroundColor: ['#66a80f', '#2f9e44', '#ffd43b', '#fab005', '#8ccf3f'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    return () => {
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
        statusChartRef.current = null;
      }
      return undefined;
    };
  }, [JSON.stringify(statusCounts)]);

  const handleReorder = async (order) => {
    setMessage('');
    const itemsPayload = (order.items || []).map((item) => ({
      product_id: item.product_id?._id || item.product_id || item.id || null,
      product_name: item.product_name || item.name || item.product_id?.name || 'Product',
      quantity: item.quantity || 1,
      price: item.price || 0
    }));

    const address = order.address || user?.address || '';
    if (!address) {
      setMessage('Please add a delivery address in your profile before reordering.');
      return;
    }

    try {
      const response = await apiService.createOrder({
        delivery_address: address,
        items: itemsPayload
      });
      if (response.status !== 'success') {
        throw new Error(response.message || 'Reorder failed');
      }
      setMessage('Reorder placed successfully.');
      loadOrders().catch(() => {});
    } catch (error) {
      setMessage(error.message || 'Reorder failed.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="customer-dashboard">
        <section className="dashboard-hero">
          <div className="container">
            <div className="dashboard-hero-content">
              <div>
                <div className="hero-chip">
                  <i className="fas fa-sparkles"></i> Fresh Grocery Insights
                </div>
                <h1>Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
                <p>Track your orders, spending, and recent activity in one place.</p>
              </div>
              <div className="hero-actions">
                <Link to="/products" className="btn btn-primary action-pill">
                  <i className="fas fa-store"></i> Shop Now
                </Link>
                <Link to="/cart" className="btn btn-outline-light action-pill">
                  <i className="fas fa-shopping-bag"></i> View Cart
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container dashboard-body">

        <div className="row g-2 g-md-3 mb-3 mb-md-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 dashboard-stat-card">
              <div className="card-body">
                <div className="text-muted small">Total Orders</div>
                <div className="fs-3 fw-bold">{stats.totalOrders}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 dashboard-stat-card">
              <div className="card-body">
                <div className="text-muted small">Total Spent</div>
                <div className="fs-3 fw-bold">Rs. {stats.totalSpent.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 dashboard-stat-card">
              <div className="card-body">
                <div className="text-muted small">Pending Orders</div>
                <div className="fs-3 fw-bold">{stats.pending}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 dashboard-stat-card">
              <div className="card-body">
                <div className="text-muted small">Delivered</div>
                <div className="fs-3 fw-bold">{stats.delivered}</div>
              </div>
            </div>
          </div>
        </div>

        {liveStatus && (
          <div className="alert alert-info d-flex align-items-center justify-content-between dashboard-alert" role="alert">
            <div>
              <i className="fas fa-signal"></i> {liveStatus}
            </div>
            <button type="button" className="btn btn-sm btn-outline-info" onClick={() => setLiveStatus('')}>
              Dismiss
            </button>
          </div>
        )}

        {message && (
          <div className="alert alert-warning" role="alert">
            {message}
          </div>
        )}

        <div className="card shadow-sm mb-3 mb-md-4 dashboard-card customer-dash-compact">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <h5 className="mb-0">Your Activity</h5>
              <div className="d-flex gap-2">
                <select className="form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-lg-8">
                <div className="customer-chart-box">
                  <canvas ref={trendCanvasRef} />
                </div>
              </div>
              <div className="col-lg-4">
                <div className="customer-chart-box">
                  <canvas ref={statusCanvasRef} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4 dashboard-card customer-filters-card">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <h5 className="mb-0">Advanced Order Filters</h5>
                <p className="small text-muted mb-0">Narrow results by status, order ID, and date range.</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary customer-filter-reset"
                onClick={() => {
                  setStatusFilter('all');
                  setSearch('');
                  setFromDate('');
                  setToDate('');
                }}
              >
                Reset
              </button>
            </div>
            <div className="dashboard-filter-summary mb-2">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="dashboardOrderSearch">Order ID Search</label>
                <input
                  id="dashboardOrderSearch"
                  type="text"
                  className="form-control customer-filter-input"
                  placeholder="Search by Order ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="dashboardOrderStatus">Order Status</label>
                <select
                  id="dashboardOrderStatus"
                  className="form-select customer-filter-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label" htmlFor="dashboardFromDate">From Date</label>
                <input
                  id="dashboardFromDate"
                  type="date"
                  className="form-control customer-filter-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="dashboardToDate">To Date</label>
                <input
                  id="dashboardToDate"
                  type="date"
                  className="form-control customer-filter-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm dashboard-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="mb-0">Recent Orders</h5>
                  <Link to="/my-orders" className="btn btn-sm btn-outline-primary">
                    View all
                  </Link>
                </div>
                {loading ? (
                  <div className="text-center text-muted py-4">Loading your orders...</div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center text-muted py-4">No orders yet. Start shopping today!</div>
                ) : (
                  recentOrders.map((order) => (
                    <div className="border rounded-3 p-3 mb-3" key={order.orderNumber}>
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <div>
                          <div className="fw-bold">Order #{order.orderNumber}</div>
                          <div className="text-muted small">Invoice #{order.invoiceNumber || 'Pending'}</div>
                          <div className="text-muted small">
                            {order.date ? new Date(order.date).toLocaleDateString() : 'Date unavailable'}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold">Rs. {order.total.toLocaleString()}</div>
                          <span className="badge bg-secondary">
                            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                        <div className="text-muted small">
                          Items: {(order.items || []).length}
                        </div>
                        <div className="d-flex gap-2">
                          <Link to="/my-orders" className="btn btn-sm btn-outline-primary">
                            Track
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark"
                            onClick={() =>
                              printInvoice(order, {
                                title: 'Customer Invoice',
                                subtitle: 'Recent Order'
                              })
                            }
                          >
                            <i className="fas fa-print"></i> Print
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReorder(order)}
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card shadow-sm mb-4 dashboard-card">
              <div className="card-body">
                <h5 className="mb-3">Account</h5>
                <div className="text-muted small mb-1">Email</div>
                <div className="fw-semibold mb-3">{user?.email || 'Not available'}</div>
                <div className="text-muted small mb-1">Address</div>
                <div className="fw-semibold mb-3">{user?.address || 'Add your address'}</div>
                <Link to="/profile" className="btn btn-outline-secondary w-100">
                  Manage Profile
                </Link>
              </div>
            </div>
            <div className="card shadow-sm dashboard-card">
              <div className="card-body">
                <h5 className="mb-3">Quick Actions</h5>
                <div className="d-grid gap-2">
                  <Link to="/products" className="btn btn-outline-primary">
                    Browse Products
                  </Link>
                  <Link to="/my-orders" className="btn btn-outline-secondary">
                    Track Orders
                  </Link>
                  <Link to="/contact" className="btn btn-outline-dark">
                    Get Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
