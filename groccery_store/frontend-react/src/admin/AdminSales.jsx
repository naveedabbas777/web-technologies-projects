import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function AdminSales({ SidebarComponent = AdminSidebar }) {
  const [salesStatus, setSalesStatus] = useState('all');
  const [salesPeriod, setSalesPeriod] = useState('daily');
  const [sales, setSales] = useState({ today: 0, previous: 0, total: 0 });
  const [byStatus, setByStatus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesTimeline, setSalesTimeline] = useState({
    daily: { labels: [], orders: [], sales: [] },
    weekly: { labels: [], orders: [], sales: [] },
    monthly: { labels: [], orders: [], sales: [] },
    yearly: { labels: [], orders: [], sales: [] }
  });
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    async function load() {
      const [statsResponse, ordersResponse] = await Promise.all([
        apiService.get(`/orders/admin/stats/all?status=${salesStatus}`),
        apiService.get('/orders')
      ]);
      const stats = statsResponse.stats || {};
      const source = ordersResponse.orders || [];
      setSales(stats.sales || { today: 0, previous: 0, total: 0 });
      setByStatus(stats.byStatus || []);
      setSalesTimeline(stats.timeline || {
        daily: { labels: [], orders: [], sales: [] },
        weekly: { labels: [], orders: [], sales: [] },
        monthly: { labels: [], orders: [], sales: [] },
        yearly: { labels: [], orders: [], sales: [] }
      });
      setOrders(source.map((o) => ({
        id: o._id,
        orderNumber: o.order_number,
        customer: o.user_id?.name || 'Customer',
        items: (o.items || []).length,
        total: o.total_amount,
        status: o.status,
        date: o.created_at || o.createdAt
      })));
    }

    load().catch(() => {});
  }, [salesStatus]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = salesStatus === 'all' ? true : o.status === salesStatus;
    const orderDate = o.date ? new Date(o.date) : null;
    const matchesDate = selectedDate
      ? orderDate && orderDate.toISOString().slice(0, 10) === selectedDate
      : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const sumForDate = (targetDate) => {
    if (!targetDate) return 0;
    return orders.reduce((acc, o) => {
      const orderDate = o.date ? new Date(o.date) : null;
      if (!orderDate) return acc;
      const orderKey = orderDate.toISOString().slice(0, 10);
      if (orderKey === targetDate && (salesStatus === 'all' || o.status === salesStatus)) {
        return acc + Number(o.total || 0);
      }
      return acc;
    }, 0);
  };

  const getPreviousDate = (targetDate) => {
    if (!targetDate) return '';
    const [year, month, day] = targetDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  };

  const selectedDayTotal = selectedDate ? sumForDate(selectedDate) : null;
  const previousDayTotal = selectedDate ? sumForDate(getPreviousDate(selectedDate)) : null;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatMonthLabel = (date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const formatWeekRangeLabel = (startDate) => {
    const startLabel = `${monthNames[startDate.getMonth()]} ${startDate.getDate()}`;
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    const endLabel = `${monthNames[end.getMonth()]} ${end.getDate()}`;
    return `${startLabel}–${endLabel}`;
  };
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
  const getWeekStart = (date) => {
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    return weekStart;
  };
  const addDays = (date, count) => {
    const next = new Date(date);
    next.setDate(next.getDate() + count);
    return next;
  };
  const addMonths = (date, count) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + count, 1);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const addYears = (date, count) => {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + count, 0, 1);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const buildContinuousBuckets = (period, totals) => {
    const keys = Array.from(totals.keys());
    if (keys.length === 0) return { labels: [], data: [] };

    if (period === 'daily') {
      const dates = keys.map((key) => new Date(key.replace('D-', '')));
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 12);
      const end = new Date(Math.max(...dates, start.getTime()));
      const labels = [];
      const data = [];
      let cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= end) {
        const key = `D-${formatLocalDateKey(cursor)}`;
        labels.push(key.replace('D-', ''));
        data.push(totals.get(key) || 0);
        cursor = addDays(cursor, 1);
      }
      return { labels, data };
    }

    if (period === 'weekly') {
      const dates = keys.map((key) => new Date(key.replace('W-', '')));
      const now = new Date();
      const anchor = new Date(now.getFullYear(), now.getMonth(), 12);
      let start = getWeekStart(anchor);
      const end = getWeekStart(new Date(Math.max(...dates, anchor.getTime())));
      const labels = [];
      const data = [];
      let cursor = new Date(start);
      while (cursor <= end) {
        const key = `W-${formatLocalDateKey(cursor)}`;
        labels.push(formatWeekRangeLabel(cursor));
        data.push(totals.get(key) || 0);
        cursor = addDays(cursor, 7);
      }
      return { labels, data };
    }

    if (period === 'monthly') {
      const dates = keys.map((key) => {
        const [year, month] = key.replace('M-', '').split('-').map(Number);
        return new Date(year, month - 1, 1);
      });
      const now = new Date();
      let start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(Math.max(...dates, start.getTime()));
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
      const labels = [];
      const data = [];
      let cursor = new Date(start);
      while (cursor <= end) {
        const key = `M-${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        labels.push(formatMonthLabel(cursor));
        data.push(totals.get(key) || 0);
        cursor = addMonths(cursor, 1);
      }
      return { labels, data };
    }

    const years = keys.map((key) => Number(key.replace('Y-', ''))).filter(Boolean);
    if (!years.length) return { labels: [], data: [] };
    const now = new Date();
    const startYear = now.getFullYear();
    const endYear = Math.max(...years, startYear);
    const labels = [];
    const data = [];
    for (let year = startYear; year <= endYear; year += 1) {
      const key = `Y-${year}`;
      labels.push(String(year));
      data.push(totals.get(key) || 0);
    }
    return { labels, data };
  };

  const salesSeries = useMemo(() => {
    const timelineSeries = salesTimeline[salesPeriod] || { labels: [], sales: [] };
    if (timelineSeries.labels?.length) {
      return {
        labels: formatLabels(salesPeriod, timelineSeries.labels || []),
        data: timelineSeries.sales || []
      };
    }

    const totals = new Map();

    orders.forEach((o) => {
      if (salesStatus !== 'all' && o.status !== salesStatus) return;
      const orderDate = o.date ? new Date(o.date) : null;
      if (!orderDate) return;

      let key = '';
      if (salesPeriod === 'weekly') {
        const weekStart = getWeekStart(orderDate);
        key = `W-${formatLocalDateKey(weekStart)}`;
      } else if (salesPeriod === 'monthly') {
        key = `M-${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (salesPeriod === 'yearly') {
        key = `Y-${orderDate.getFullYear()}`;
      } else {
        key = `D-${formatLocalDateKey(orderDate)}`;
      }

      const current = totals.get(key) || 0;
      totals.set(key, current + Number(o.total || 0));
    });

    const { labels, data } = buildContinuousBuckets(salesPeriod, totals);
    return { labels, data };
  }, [orders, salesStatus, salesPeriod, salesTimeline]);

  const shouldAutoSkip = salesPeriod === 'monthly' || salesPeriod === 'yearly';

  return (
    <div className="admin-container">
      <SidebarComponent />
      <div className="admin-content">
        <AdminTopbar title="Sales" iconClass="fas fa-chart-bar" />
        <div className="admin-page-content">
          <div className="stats-cards-grid sales-summary">
            <div className="stats-card gradient sales-summary-card">
              <h3>{selectedDate ? 'Selected Day Sales' : 'Today Sales'}</h3>
              <div className="value">
                Rs. {Number(selectedDate ? selectedDayTotal : sales.today).toLocaleString()}
              </div>
            </div>
            <div className="stats-card gradient sales-summary-card">
              <h3>{selectedDate ? 'Previous Day Sales' : 'Previous Sales'}</h3>
              <div className="value">
                Rs. {Number(selectedDate ? previousDayTotal : sales.previous).toLocaleString()}
              </div>
            </div>
            <div className="stats-card gradient sales-summary-card">
              <h3>{selectedDate ? 'Total Money (Selected Day)' : 'Total Money Record'}</h3>
              <div className="value">
                Rs. {Number(selectedDate ? selectedDayTotal : sales.total).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>
              <i className="fas fa-chart-line" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Sales Trend
            </h4>
            <div className="sales-trend-controls">
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
            <div className="line-chart">
              <ChartCanvas
                labels={salesSeries.labels}
                data={salesSeries.data}
                color="#16a34a"
                yAxisTitle="Amount (Rs.)"
                shouldAutoSkip={shouldAutoSkip}
              />
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>
              <i className="fas fa-layer-group" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              Sales by Status
            </h4>
            <div className="table-container">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Orders</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {byStatus.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    byStatus.map((row) => (
                      <tr key={row._id}>
                        <td>{row._id}</td>
                        <td>{row.count}</td>
                        <td>Rs. {Number(row.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stats-card">
            <h4 style={{ marginBottom: '20px', color: 'var(--text-dark)' }}>
              <i className="fas fa-list" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
              All Sales
            </h4>
            <div className="row mb-3 sales-filters">
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
              <div className="col-md-4">
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="table-container sales-table">
              <table className="table table-hover admin-sales-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No sales found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td data-label="Order ID"><strong>{o.orderNumber}</strong></td>
                        <td data-label="Customer">{o.customer}</td>
                        <td data-label="Items">{o.items} items</td>
                        <td data-label="Total">Rs. {Number(o.total || 0).toLocaleString()}</td>
                        <td data-label="Status">{o.status}</td>
                        <td data-label="Date">{o.date ? new Date(o.date).toLocaleDateString() : '-'}</td>
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
  );
}

function ChartCanvas({ labels, data, color, yAxisTitle, shouldAutoSkip }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const displayValue = (value) => `Rs. ${Math.round(value).toLocaleString()}`;

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const maxValue = data.length ? Math.max(...data) : 0;
    const minValue = data.length ? Math.min(...data) : 0;
    const goalValue = data.length ? data.reduce((sum, value) => sum + value, 0) / data.length : 0;

    const markerPlugin = {
      id: 'valueMarkers',
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const { right } = chartArea;
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
            backgroundColor: 'rgba(22, 163, 74, 0.18)',
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
        layout: { padding: { right: 90, bottom: 6 } },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#334155',
              maxRotation: 0,
              autoSkip: shouldAutoSkip,
              maxTicksLimit: shouldAutoSkip ? 8 : undefined
            }
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
  }, [JSON.stringify(labels), JSON.stringify(data), color, yAxisTitle, shouldAutoSkip]);

  return <canvas ref={canvasRef} className="chart-canvas" />;
}
