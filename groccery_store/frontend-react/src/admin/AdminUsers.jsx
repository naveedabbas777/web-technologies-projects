import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import SkeletonTable from '../components/ui/SkeletonTable.jsx';

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Staff', value: 'staff' },
  { label: 'Rider', value: 'delivery_rider' },
  { label: 'Customer', value: 'customer' }
];

export default function AdminUsers() {
  const { showAlert } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const resp = await apiService.get('/auth/users?limit=200');
      if (resp.status === 'success') {
        setUsers(resp.users || []);
        showAlert('Users loaded successfully.', 'success', 'Users');
      } else {
        setMessage(resp.message || 'Failed to load users.');
        showAlert(resp.message || 'Failed to load users.', 'error', 'Users');
      }
    } catch (error) {
      setMessage('Failed to load users.');
      showAlert('Failed to load users.', 'error', 'Users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers().catch(() => {});
  }, []);

  const updateRole = async (userId, role) => {
    if (!userId) {
      showAlert('User ID is missing.', 'error', 'Invalid action');
      return;
    }
    try {
      const resp = await apiService.put(`/auth/users/${userId}/role`, { role });
      if (resp.status !== 'success') {
        throw new Error(resp.message || 'Failed to update role.');
      }
      showAlert('User role updated successfully.', 'success', 'Users');
      await loadUsers();
    } catch (error) {
      setMessage(error.message || 'Failed to update role.');
      showAlert(error.message || 'Failed to update role.', 'error', 'Users');
    }
  };

  const setActive = async (userId, isActive) => {
    if (!userId) {
      showAlert('User ID is missing.', 'error', 'Invalid action');
      return;
    }
    const endpoint = isActive ? 'activate' : 'deactivate';
    try {
      const resp = await apiService.put(`/auth/users/${userId}/${endpoint}`, {});
      if (resp.status !== 'success') {
        throw new Error(resp.message || 'Failed to update status.');
      }
      showAlert(`User ${isActive ? 'activated' : 'deactivated'} successfully.`, 'success', 'Users');
      await loadUsers();
    } catch (error) {
      setMessage(error.message || 'Failed to update status.');
      showAlert(error.message || 'Failed to update status.', 'error', 'Users');
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar title="User Management" iconClass="fas fa-users" />
        <div className="admin-page-content">
          <Card title="Role Permissions" iconClass="fas fa-shield-alt">
            <div className="table-container">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Admin</td>
                    <td>Full access (all admin pages and settings)</td>
                  </tr>
                  <tr>
                    <td>Staff</td>
                    <td>Products (create/update), Orders, Delivery assignments; no settings/users</td>
                  </tr>
                  <tr>
                    <td>Rider</td>
                    <td>Rider dashboard only (pick/complete deliveries)</td>
                  </tr>
                  <tr>
                    <td>Customer</td>
                    <td>Shop, cart, checkout, orders, profile</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          {message && <div className="alert alert-warning">{message}</div>}
          {loading ? (
            <Card>
              <SkeletonTable rows={6} columns={5} />
            </Card>
          ) : (
            <Card title="Users" iconClass="fas fa-user-cog">
              <div className="table-container">
                <table className="table table-hover admin-data-table admin-users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={user.role}
                            onChange={(e) => updateRole(user._id, e.target.value)}
                          >
                            {roleOptions.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {user.is_active ? (
                            <Button variant="danger" size="sm" onClick={() => setActive(user._id, false)}>
                              Deactivate
                            </Button>
                          ) : (
                            <Button variant="success" size="sm" onClick={() => setActive(user._id, true)}>
                              Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
