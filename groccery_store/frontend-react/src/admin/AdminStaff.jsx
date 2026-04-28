import React, { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { apiService } from '../api/apiService.js';

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'delivery_rider',
    address: ''
  });

  useEffect(() => {
    loadStaff().catch(() => {});
  }, []);

  const loadStaff = async () => {
    const response = await apiService.get('/staff');
    const source = response.staff || [];
    setStaff(source.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone || '-',
      role: s.role,
      status: s.is_active ? 'active' : 'inactive'
    })));
  };

  const addStaff = async (e) => {
    e.preventDefault();
    await apiService.post('/staff', form);
    setForm({ name: '', email: '', phone: '', password: '', role: 'delivery_rider', address: '' });
    setShowStaffPassword(false);
    setShowModal(false);
    await loadStaff();
  };

  const updateStatus = async (id, status) => {
    await apiService.put(`/staff/${id}`, { is_active: status === 'active' });
    await loadStaff();
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    await apiService.delete(`/staff/${id}`);
    await loadStaff();
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-content">
        <AdminTopbar
          title="Staff Members Management"
          iconClass="fas fa-user-tie"
          actions={(
            <button className="btn admin-add-staff-btn" onClick={() => setShowModal(true)}>
              <i className="fas fa-user-plus"></i> Add Staff
            </button>
          )}
        />
        <div className="admin-page-content">
          <div className="table-container">
            <table className="table table-hover admin-data-table admin-staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th className="admin-table-status-col">Status</th>
                  <th className="admin-table-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td><strong>{member.id}</strong></td>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.phone}</td>
                    <td>{member.role}</td>
                    <td className="admin-table-status-col">
                      <select
                        className="form-select form-select-sm admin-status-select"
                        value={member.status}
                        onChange={(e) => updateStatus(member.id, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="admin-table-actions-col">
                      <button className="btn btn-sm btn-danger" onClick={() => deleteStaff(member.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showModal && (
            <>
              <div className="modal fade show" style={{ display: 'block' }}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div
                      className="modal-header"
                      style={{ background: 'linear-gradient(135deg, #2f9e44 0%, #1f7a32 100%)' }}
                    >
                      <h5 className="modal-title text-white">Add Staff Member</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setShowStaffPassword(false);
                          setShowModal(false);
                        }}
                      ></button>
                    </div>
                    <form onSubmit={addStaff}>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Password</label>
                          <div className="password-toggle-wrap">
                            <input
                              type={showStaffPassword ? 'text' : 'password'}
                              className="form-control"
                              value={form.password}
                              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowStaffPassword((prev) => !prev)}
                              aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                              title={showStaffPassword ? 'Hide password' : 'Show password'}
                            >
                              <i className={`fas ${showStaffPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={form.role}
                            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                          >
                            <option value="delivery_rider">Delivery Rider</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <input
                            type="text"
                            className="form-control"
                            value={form.address}
                            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowStaffPassword(false);
                            setShowModal(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">Add Staff</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
