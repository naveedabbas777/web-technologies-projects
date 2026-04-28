import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { io } from 'socket.io-client';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0
  });
  const [sales, setSales] = useState({
    today: 0,
    previous: 0,
    total: 0
  });
  const [ordersStatus, setOrdersStatus] = useState('all');
  const [salesStatus, setSalesStatus] = useState('all');
  const [ordersPeriod, setOrdersPeriod] = useState('daily');
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [ordersTimeline, setOrdersTimeline] = useState({
    daily: { labels: [], orders: [], sales: [] },
    weekly: { labels: [], orders: [], sales: [] },
    monthly: { labels: [], orders: [], sales: [] },
    yearly: { labels: [], orders: [], sales: [] }
  });
  const [salesTimeline, setSalesTimeline] = useState({
    daily: { labels: [], orders: [], sales: [] },
    weekly: { labels: [], orders: [], sales: [] },
    monthly: { labels: [], orders: [], sales: [] },
    yearly: { labels: [], orders: [], sales: [] }
  });
  const [alerts, setAlerts] = useState({
    expiringSoon: [],
    lowStock: []
  });
  const [alertSettings, setAlertSettings] = useState({
    lowStockAlertThreshold: 5,
    expiringMonthsAlert: 3
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [activeAlertPanel, setActiveAlertPanel] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [
        ordersStatsResp,
        salesStatsResp,
        productStatsResp,
        customersResp,
        ordersResp,
        settingsResp
      ] = await Promise.all([
        apiService.get(`/orders/admin/stats/all?status=${ordersStatus}`),
        apiService.get(`/orders/admin/stats/all?status=${salesStatus}`),
        apiService.get('/products/stats/all'),
        apiService.get('/customers'),
        apiService.get('/orders'),
        apiService.get('/settings')
      ]);

      const orderStats = ordersStatsResp.stats || {};
      const salesStatsRoot = salesStatsResp.stats || {};
      const productStats = productStatsResp.stats || {};
      const orders = ordersResp.orders || [];
      const recent = orders.slice(0, 5).map((o) => ({
        id: o.order_number,
        customer: o.user_id?.name || 'Customer',
        amount: Number(o.total_amount || 0).toLocaleString(),
        status: o.status,
        date: new Date(o.created_at || o.createdAt).toLocaleDateString()
      }));

      const salesStats = salesStatsRoot.sales || {};
      const ordersTimelineStats = orderStats.timeline || {};
      const salesTimelineStats = salesStatsRoot.timeline || {};
      const resolvedSettings = settingsResp.settings || {};
      const expiringMonths = parseInt(resolvedSettings.expiringMonthsAlert, 10) || 3;
      const lowStockLimit = parseInt(resolvedSettings.lowStockAlertThreshold, 10) || 5;
      const [expiringResp, lowStockResp] = await Promise.all([
        apiService.get(`/products/admin/alerts?expiringMonths=${expiringMonths}`),
        apiService.get(`/products/admin/alerts?lowStock=${lowStockLimit}`)
      ]);

      if (!isMounted) return;

      setStats({
        totalOrders: orderStats.totalOrders || 0,
        totalRevenue: orderStats.totalRevenue || 0,
        totalCustomers: customersResp.pagination?.total || (customersResp.customers || []).length || 0,
        totalProducts: productStats.activeProducts || 0
      });
      setSales({
        today: salesStats.today || 0,
        previous: salesStats.previous || 0,
        total: salesStats.total || 0
      });
      setOrdersTimeline({
        daily: ordersTimelineStats.daily || { labels: [], orders: [], sales: [] },
        weekly: ordersTimelineStats.weekly || { labels: [], orders: [], sales: [] },
        monthly: ordersTimelineStats.monthly || { labels: [], orders: [], sales: [] },
        yearly: ordersTimelineStats.yearly || { labels: [], orders: [], sales: [] }
      });
      setSalesTimeline({
        daily: salesTimelineStats.daily || { labels: [], orders: [], sales: [] },
        weekly: salesTimelineStats.weekly || { labels: [], orders: [], sales: [] },
        monthly: salesTimelineStats.monthly || { labels: [], orders: [], sales: [] },
        yearly: salesTimelineStats.yearly || { labels: [], orders: [], sales: [] }
      });
      setAlertSettings({
        lowStockAlertThreshold: lowStockLimit,
        expiringMonthsAlert: expiringMonths
      });
      setAlerts({
        expiringSoon: expiringResp.products || [],
        lowStock: lowStockResp.products || []
      });
      setRecentOrders(recent);
    };

    load().catch(() => {});

    const socketBase = apiService.baseURL.replace(/\/api\/?$/, '');
    if (!socketRef.current) {
      socketRef.current = io(socketBase, { transports: ['websocket'] });
    }

    const socket = socketRef.current;
    socket.on('orders:changed', () => {
      load().catch(() => {});
    });
    socket.on('products:changed', () => {
      load().catch(() => {});
    });

    return () => {
      isMounted = false;
      if (socket) {
        socket.off('orders:changed');
        socket.off('products:changed');
      }
    };
  }, [ordersStatus, salesStatus]);

  const formatExpiry = (value) => (value ? new Date(value).toLocaleDateString() : 'No expiry');
  const goToProduct = (product) => {
    const productId = product?._id || product?.id;
    const fallbackName = product?.name || '';
    if (!productId && !fallbackName) return;
    setActiveAlertPanel('');
    const highlightValue = productId || fallbackName;
    navigate(`/admin/products?highlight=${encodeURIComponent(highlightValue)}`);
  };

  return (
    <>
      <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar title="Dashboard" iconClass="fas fa-chart-line" />
        <div className="admin-page-content">
          <div className="stats-cards-grid">
            <div
              className="stats-card gradient clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/orders')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate('/admin/orders');
                }
              }}
            >
              <h3>Total Orders</h3>
              <div className="value">{stats.totalOrders}</div>
            </div>
            <div
              className="stats-card gradient clickable"
              style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/sales')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate('/admin/sales');
                }
              }}
            >
              <h3>Total Revenue</h3>
              <div className="value">Rs. {Number(stats.totalRevenue).toLocaleString()}</div>
            </div>
            <div
              className="stats-card gradient clickable"
              style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/customers')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate('/admin/customers');
                }
              }}
            >
              <h3>Total Customers</h3>
              <div className="value">{stats.totalCustomers}</div>
            </div>
            <div
              className="stats-card gradient clickable"
              style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/products')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  navigate('/admin/products');
                }
              }}
            >
              <h3>Total Products</h3>
              <div className="value">{stats.totalProducts}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <h4 style={{ marginBottom: '6px', color: 'var(--text-dark)' }}>
                  <i className="fas fa-chart-line" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                  Orders & Sales Trend
                </h4>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Daily, weekly, monthly, and yearly totals
                </div>
              </div>
            </div>

            <TrendSummary period={ordersPeriod} timeline={ordersTimeline} />
            <div className="trend-charts">
              <div className="trend-chart-block">
                <div className="trend-chart-head">
                  <div className="trend-chart-title">Orders</div>
                  <div className="trend-chart-filters">
                    <select
                      className="form-select"
                      value={ordersPeriod}
                      onChange={(e) => setOrdersPeriod(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <select
                      className="form-select"
                      value={ordersStatus}
                      onChange={(e) => setOrdersStatus(e.target.value)}
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
                </div>
                <ChartCanvas period={ordersPeriod} timeline={ordersTimeline} type="orders" color="#22c55e" />
              </div>
              <div className="trend-chart-block">
                <div className="trend-chart-head">
                  <div className="trend-chart-title">Sales (Rs.)</div>
                  <div className="trend-chart-filters">
                    <select
                      className="form-select"
                      value={salesPeriod}
                      onChange={(e) => setSalesPeriod(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <select
                      className="form-select"
                      value={salesStatus}
                      onChange={(e) => setSalesStatus(e.target.value)}
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
                </div>
                <ChartCanvas period={salesPeriod} timeline={salesTimeline} type="sales" color="#16a34a" />
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-bell" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Product Alerts
            </h4>
            <div className="text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
              Low stock ({'<='} {alertSettings.lowStockAlertThreshold}) and products expiring within {alertSettings.expiringMonthsAlert} months
            </div>
            <div className="alerts-icon-row">
              <button
                type="button"
                className="alert-icon-card warning"
                onClick={() => setActiveAlertPanel('expiring')}
              >
                <span className="alert-icon"><i className="fas fa-hourglass-half"></i></span>
                <span className="alert-icon-label">Expiring</span>
                <span className="alert-icon-count">{alerts.expiringSoon.length}</span>
              </button>
              <button
                type="button"
                className="alert-icon-card danger"
                onClick={() => setActiveAlertPanel('lowStock')}
              >
                <span className="alert-icon"><i className="fas fa-boxes"></i></span>
                <span className="alert-icon-label">Low Stock</span>
                <span className="alert-icon-count">{alerts.lowStock.length}</span>
              </button>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>
              <i className="fas fa-receipt" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Recent Orders
            </h4>
            <div className="table-container">
              <table className="table table-hover admin-data-table admin-recent-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>{order.id}</strong></td>
                        <td>{order.customer}</td>
                        <td>Rs. {order.amount}</td>
                        <td>
                          <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td>{order.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
      {activeAlertPanel && (
      <>
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div
                className="modal-header"
                style={{ background: 'linear-gradient(135deg, #2f9e44 0%, #1f7a32 100%)' }}
              >
                <h5 className="modal-title text-white">
                  {activeAlertPanel === 'expiring' ? 'Expiring Products' : 'Low Stock Products'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveAlertPanel('')}></button>
              </div>
              <div className="modal-body">
                {activeAlertPanel === 'expiring' && (
                  alerts.expiringSoon.length === 0 ? (
                    <div className="alert alert-secondary">No expiring products.</div>
                  ) : (
                    <ul className="alert-list">
                      {alerts.expiringSoon.map((p) => (
                        <li key={p._id || p.id || p.name}>
                          <button
                            type="button"
                            className="alert-item-link"
                            onClick={() => goToProduct(p)}
                          >
                            <div className="alert-item-title">{p.name}</div>
                            <div className="alert-item-meta">
                              {p.category} • {p.stock_quantity} in stock • exp {formatExpiry(p.expiry_date)}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                )}
                {activeAlertPanel === 'lowStock' && (
                  alerts.lowStock.length === 0 ? (
                    <div className="alert alert-secondary">No low stock products.</div>
                  ) : (
                    <ul className="alert-list">
                      {alerts.lowStock.map((p) => (
                        <li key={p._id || p.id || p.name}>
                          <button
                            type="button"
                            className="alert-item-link"
                            onClick={() => goToProduct(p)}
                          >
                            <div className="alert-item-title">{p.name}</div>
                            <div className="alert-item-meta">
                              {p.category} • {p.stock_quantity} in stock • exp {formatExpiry(p.expiry_date)}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
      )}
    </>
  );
}

function TrendSummary({ period, timeline }) {
  const series = timeline[period] || { orders: [], sales: [] };
  const totalOrders = series.orders.reduce((sum, value) => sum + value, 0);
  const totalSales = series.sales.reduce((sum, value) => sum + value, 0);

  return (
    <div className="chart-summary">
      <div className="chart-summary-card">
        <div className="label">Total Orders ({period})</div>
        <div className="value">{totalOrders}</div>
      </div>
      <div className="chart-summary-card">
        <div className="label">Total Sales ({period})</div>
        <div className="value">Rs. {Number(totalSales).toLocaleString()}</div>
      </div>
      <div className="chart-legend">
        <span className="legend-dot orders"></span> Orders
        <span className="legend-dot sales"></span> Sales
      </div>
    </div>
  );
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getWeekRangeLabel = (weekLabel) => {
  const [yearPart, weekPart] = weekLabel.split('-W');
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!year || !week) return weekLabel;

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const startLabel = `${monthNames[monday.getUTCMonth()]} ${monday.getUTCDate()}`;
  const endLabel = `${monthNames[sunday.getUTCMonth()]} ${sunday.getUTCDate()}`;
  return `${startLabel}–${endLabel}`;
};

const formatLabels = (period, labels) => {
  if (period === 'weekly') {
    return labels.map((label) => getWeekRangeLabel(label));
  }
  return labels;
};

function ChartCanvas({ period, timeline, type, color }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const series = timeline[period] || { labels: [], orders: [], sales: [] };
  const labels = formatLabels(period, series.labels || []);
  const data = type === 'sales' ? (series.sales || []) : (series.orders || []);
  const yAxisTitle = type === 'sales' ? 'Amount (Rs.)' : 'Orders';
  const fillColor = type === 'sales' ? 'rgba(22, 163, 74, 0.18)' : 'rgba(34, 197, 94, 0.18)';
  const displayValue = (value) => {
    if (type === 'sales') return `Rs. ${Math.round(value).toLocaleString()}`;
    return `${Math.round(value)}`;
  };

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const maxValue = data.length ? Math.max(...data) : 0;
    const minValue = data.length ? Math.min(...data) : 0;
    const goalValue = data.length
      ? data.reduce((sum, value) => sum + value, 0) / data.length
      : 0;

    const markerPlugin = {
      id: 'valueMarkers',
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const { left, right, top, bottom } = chartArea;
        const yScale = chart.scales.y;

        const drawLabel = (value, label, offset = 0) => {
          const y = yScale.getPixelForValue(value) + offset;
          ctx.save();
          ctx.fillStyle = '#0f172a';
          ctx.font = '12px Segoe UI, sans-serif';
          ctx.fillText(`${label} ${displayValue(value)}`, right + 8, y + 4);
          ctx.restore();
        };

        drawLabel(maxValue, 'Max');
        drawLabel(goalValue, 'Goal');
        drawLabel(minValue, 'Min');
      }
    };

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: yAxisTitle,
            data,
            borderColor: color,
            borderWidth: 2.5,
            backgroundColor: fillColor,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Goal',
            data: labels.map(() => goalValue),
            borderColor: '#16a34a',
            borderDash: [6, 6],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 90 } },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#334155', maxRotation: 0, autoSkip: true }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: { color: '#334155' },
            title: {
              display: true,
              text: yAxisTitle,
              color: '#1f2937',
              font: { size: 12, weight: '600' }
            }
          }
        }
      },
      plugins: [markerPlugin]
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return undefined;
    };
  }, [period, type, color, yAxisTitle, JSON.stringify(labels), JSON.stringify(data)]);

  return (
    <div className="line-chart">
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
}
