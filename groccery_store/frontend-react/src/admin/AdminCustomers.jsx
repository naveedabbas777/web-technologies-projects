import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminCustomers({ SidebarComponent = AdminSidebar, readOnly = false }) {
  const { showAlert } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCustomers().catch(() => {
      showAlert('Failed to load customers.', 'error', 'Customers');
    });
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await apiService.get('/customers?limit=200&page=1');
      const source = response.customers || [];
      setCustomers(source.map((u) => {
        const parts = (u.name || 'User').split(' ');
        return {
          id: u._id,
          firstName: parts[0] || 'User',
          lastName: parts.slice(1).join(' ') || '',
          email: u.email,
          phone: u.phone || '-',
          status: u.is_active ? 'active' : 'inactive',
          address: u.address || '-',
          joinDate: u.created_at || u.createdAt,
          orders: Number(u.stats?.totalOrders || 0),
          spent: Number(u.stats?.totalSpent || 0)
        };
      }));
    } catch (error) {
      setCustomers([]);
      showAlert(error.message || 'Failed to load customers.', 'error', 'Customers');
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const updateCustomerStatus = async (id, status) => {
    if (readOnly) {
      showAlert('This screen is read-only.', 'info', 'Not allowed');
      return;
    }
    if (!id) {
      showAlert('Customer ID is missing.', 'error', 'Invalid action');
      return;
    }
    try {
      await apiService.put(`/customers/${id}`, { is_active: status === 'active' });
      showAlert('Customer status updated successfully.', 'success', 'Customer updated');
      await loadCustomers();
    } catch (error) {
      showAlert(error.message || 'Failed to update customer status.', 'error', 'Update failed');
    }
  };

  const deleteCustomer = async (id) => {
    if (readOnly) {
      showAlert('This screen is read-only.', 'info', 'Not allowed');
      return;
    }
    if (!id) {
      showAlert('Customer ID is missing.', 'error', 'Invalid action');
      return;
    }
    if (!window.confirm('Are you sure? This action cannot be undone.')) {
      showAlert('Customer deletion was cancelled.', 'info', 'Cancelled');
      return;
    }
    try {
      await apiService.delete(`/customers/${id}`);
      showAlert('Customer deleted successfully.', 'success', 'Customer removed');
      await loadCustomers();
    } catch (error) {
      showAlert(error.message || 'Failed to delete customer.', 'error', 'Delete failed');
    }
  };

  return (
    <div className="admin-container">
      <SidebarComponent />
      <div className="admin-content">
        <AdminTopbar
          title="Customers Management"
          iconClass="fas fa-users"
          actions={(
            <NavLink to="/admin/profile" className="btn admin-profile-quick-btn">
              <i className="fas fa-user-circle"></i> Profile
            </NavLink>
          )}
        />
        <div className="admin-page-content">
          <div className="filters-container">
            <div className="row">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Customers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="table table-hover admin-data-table admin-customers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Spent (Rs.)</th>
                  <th className="admin-table-status-col">Status</th>
                  {!readOnly && <th className="admin-table-actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td>{c.firstName} {c.lastName}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td><strong>{c.orders}</strong></td>
                    <td><strong style={{ color: '#28a745' }}>Rs. {c.spent}</strong></td>
                    <td className="admin-table-status-col">
                      {readOnly ? (
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {c.status}
                        </span>
                      ) : (
                        <select
                          className="form-select form-select-sm admin-status-select"
                          value={c.status}
                          onChange={(e) => updateCustomerStatus(c.id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="admin-table-actions-col">
                        <button className="btn btn-sm btn-danger" onClick={() => deleteCustomer(c.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    )}
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
